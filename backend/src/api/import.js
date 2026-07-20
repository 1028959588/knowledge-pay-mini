// backend/src/api/import.js

const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const Parser = require('rss-parser')
const crypto = require('crypto')
const { Op } = require('sequelize')
const auth = require('../middleware/auth')
const { Article, Category } = require('../models')
const { processArticleImages } = require('../utils/oss')

const router = express.Router()
const parser = new Parser()

// ============================================================
// 工具函数
// ============================================================

function getContentHash(content) {
  return crypto
    .createHash('md5')
    .update(content || '')
    .digest('hex')
}

function extractText(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

function truncateSummary(text, maxLength = 200) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

function extractImage($, selectors) {
  for (const selector of selectors) {
    const src = $(selector).attr('src') || $(selector).attr('content')
    if (src && src.startsWith('http')) {
      return src
    }
  }
  return ''
}

// ============================================================
// 清理公众号内容（保留图片标签，不破坏 HTML 结构）
// ============================================================
function cleanWechatContent(html) {
  if (!html) return ''
  
  // 移除 script 和 style
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
  
  // 移除打赏区域
  html = html.replace(/<div[^>]*class="[^"]*reward[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  
  // 移除投票区域
  html = html.replace(/<div[^>]*class="[^"]*vote[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  
  // 移除广告
  html = html.replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  
  // 移除底部版权
  html = html.replace(/<div[^>]*class="[^"]*copyright[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  
  // 移除腾讯视频等嵌入代码
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
  
  // 移除空白段落
  html = html.replace(/<p>\s*<\/p>/g, '')
  
  // ✅ 修复图片懒加载 (data-src -> src)
  html = html.replace(/data-src/g, 'src')
  html = html.replace(/data-original/g, 'src')
  
  // ✅ 移除图片的 loading 属性（避免懒加载冲突）
  html = html.replace(/loading="[^"]*"/gi, '')
  
  // ✅ 添加图片自适应样式
  html = html + '<style>img{max-width:100%;height:auto;display:block;margin:10rpx 0;border-radius:8rpx;}</style>'
  
  return html
}

// ============================================================
// 抓取公众号文章核心函数（带图片处理）
// ============================================================
async function fetchWechatArticle(url) {
  try {
    console.log('📱 开始抓取公众号文章:', url)
    
    // 获取页面内容
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // 提取标题
    let title = $('#activity-name').text().trim()
    if (!title) {
      title = $('h1').first().text().trim()
    }
    if (!title) {
      title = $('title').text().trim().replace(' - 微信公众平台', '')
    }
    
    // 提取作者
    let author = $('#js_name').text().trim()
    if (!author) {
      author = $('.profile_nickname').text().trim()
    }
    if (!author) {
      author = $('.rich_media_meta .rich_media_meta_text').first().text().trim()
    }
    
    // 提取正文
    let contentHtml = $('#js_content').html()
    if (!contentHtml) {
      contentHtml = $('.rich_media_content').html()
    }
    if (!contentHtml) {
      contentHtml = $('.article_content').html()
    }
    
    // ✅ 清理内容（保留图片标签）
    let content = cleanWechatContent(contentHtml || '')
    
    // ✅ 处理图片：下载并上传到 OSS
    if (content) {
      console.log('📸 开始处理文章图片...')
      content = await processArticleImages(content)
    }
    
    // 提取封面图
    let cover = $('meta[property="og:image"]').attr('content')
    if (!cover) {
      cover = $('#js_pc_qr_code_img').attr('src')
    }
    if (!cover) {
      cover = $('img').first().attr('src')
    }
    
    // ✅ 封面图也上传到 OSS
    if (cover && !cover.includes('knowledge-pay-img.oss-cn-guangzhou.aliyuncs.com')) {
      try {
        const { downloadAndUploadImage } = require('../utils/oss')
        cover = await downloadAndUploadImage(cover)
        console.log('✅ 封面上传成功')
      } catch (err) {
        console.error('❌ 封面上传失败:', err.message)
      }
    }
    
    // 提取摘要
    let summary = $('meta[name="description"]').attr('content')
    if (!summary) {
      summary = content.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
    }
    
    // 提取发布时间
    let publishTime = null
    const timeText = $('.rich_media_meta_text').filter((i, el) => {
      return $(el).text().includes('年') || $(el).text().includes('-')
    }).text().trim()
    if (timeText) {
      try {
        publishTime = new Date(timeText)
      } catch (e) {}
    }
    
    return {
      title: title || '未知标题',
      author: author || '未知作者',
      cover: cover || '',
      summary: summary || '',
      content: content || '<p>内容加载失败</p>',
      publishTime: publishTime || new Date()
    }
    
  } catch (error) {
    console.error('❌ 抓取公众号失败:', error.message)
    return null
  }
}

// ============================================================
// 1. 获取支持的 RSS 源列表
// ============================================================
router.get('/sources', async (req, res) => {
  const sources = [
    { id: 'openai', name: 'OpenAI 博客', url: 'https://openai.com/news/rss.xml', icon: '🤖' },
    { id: 'deepmind', name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', icon: '🧠' },
    { id: 'jiqizhixin', name: '机器之心', url: 'https://www.jiqizhixin.com/rss', icon: '📊' },
    { id: 'arxiv_ai', name: 'arXiv AI 论文', url: 'https://rss.arxiv.org/rss/cs.AI', icon: '📄' },
    { id: 'ruanyifeng', name: '阮一峰博客', url: 'https://www.ruanyifeng.com/blog/atom.xml', icon: '📖' },
    { id: 'v2ex', name: 'V2EX 热门', url: 'https://www.v2ex.com/feed/tab/hot.xml', icon: '💬' },
    { id: 'hn', name: 'Hacker News', url: 'https://hnrss.org/frontpage', icon: '🔥' },
    { id: 'sspai', name: '少数派', url: 'https://sspai.com/feed', icon: '🎯' },
    { id: 'react', name: 'React 官方博客', url: 'https://react.dev/rss.xml', icon: '⚛️' },
    { id: 'vue', name: 'Vue.js 官方博客', url: 'https://blog.vuejs.org/feed.rss', icon: '🟢' },
    { id: 'python', name: 'Python 官方博客', url: 'https://blog.python.org/feeds/posts/default', icon: '🐍' },
    { id: 'go', name: 'Go 官方博客', url: 'https://go.dev/blog/feed.atom', icon: '🐹' },
    { id: 'rust', name: 'Rust 官方博客', url: 'https://blog.rust-lang.org/feed.xml', icon: '🦀' },
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', icon: '📰' },
    { id: 'theverge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', icon: '💻' },
    { id: 'ithome', name: 'IT之家', url: 'https://www.ithome.com/rss/', icon: '🏠' },
  ]
  
  res.json({ code: 0, data: sources })
})

// ============================================================
// 2. 预览 RSS 源内容
// ============================================================
router.get('/preview/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params
    const { limit = 20 } = req.query
    
    const sourcesResp = await axios.get('http://localhost:8080/api/import/sources')
    const sources = sourcesResp.data.data
    const source = sources.find(s => s.id === sourceId)
    
    if (!source) {
      return res.status(404).json({ code: 1, message: '源不存在' })
    }
    
    const feed = await parser.parseURL(source.url)
    
    const existingTitles = await Article.findAll({
      attributes: ['title'],
      where: { status: 1 }
    }).then(rows => rows.map(r => r.title))
    
    const items = feed.items.slice(0, parseInt(limit)).map(item => {
      const content = item.content || item['content:encoded'] || item.summary || ''
      const isDuplicate = existingTitles.includes(item.title)
      
      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet || item.summary || '',
        content: content,
        cover: item.enclosure?.url || item.image?.url || '',
        author: item.author || feed.title || '',
        isDuplicate: isDuplicate
      }
    })
    
    res.json({ 
      code: 0, 
      data: { 
        source: source,
        total: feed.items.length,
        items: items 
      } 
    })
  } catch (error) {
    console.error('预览失败:', error)
    res.status(500).json({ code: 1, message: error.message || '预览失败' })
  }
})

// ============================================================
// 3. 批量导入文章
// ============================================================
router.post('/import', async (req, res) => {
  try {
    const { sourceId, items, category_id, type = 1, autoPublish = false } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({ code: 1, message: '请选择要导入的文章' })
    }
    
    if (!category_id) {
      return res.status(400).json({ code: 1, message: '请选择目标分类' })
    }
    
    const category = await Category.findByPk(category_id)
    if (!category) {
      return res.status(404).json({ code: 1, message: '分类不存在' })
    }
    
    const results = { 
      success: 0, 
      fail: 0, 
      skipped: 0, 
      total: items.length,
      errors: [],
      details: []
    }
    
    for (const [index, item] of items.entries()) {
      try {
        const title = item.title?.trim() || `文章 ${index + 1}`
        
        const content = item.content || ''
        const contentHash = getContentHash(content)
        const link = item.link || ''
        
        const existConditions = [
          { title: title }
        ]
        
        if (link) {
          existConditions.push({ cover: link })
        }
        
        const exist = await Article.findOne({
          where: {
            [Op.or]: existConditions,
            status: 1
          }
        })
        
        if (exist) {
          results.skipped++
          results.details.push({
            title: title,
            status: 'skipped',
            reason: '文章已存在'
          })
          continue
        }
        
        let fullContent = content
        let cover = item.cover || ''
        
        if (!fullContent && link) {
          try {
            const response = await axios.get(link, {
              timeout: 15000,
              headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            const $ = cheerio.load(response.data)
            
            const contentSelectors = [
              'article', '.content', '.post-content', 
              '.entry-content', '.article-content', '.blog-content'
            ]
            
            for (const selector of contentSelectors) {
              const html = $(selector).html()
              if (html && html.length > 100) {
                fullContent = html
                break
              }
            }
            
            if (!cover) {
              const coverSelectors = [
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
                'img[class*="cover"]',
                'img[class*="featured"]',
                '.post-image img',
                '.article-image img'
              ]
              cover = extractImage($, coverSelectors)
            }
            
          } catch (err) {
            console.warn('抓取内容失败:', link, err.message)
          }
        }
        
        const summary = item.summary || item.contentSnippet || 
                        truncateSummary(extractText(fullContent), 200)
        
        const publishTime = item.pubDate ? new Date(item.pubDate) : new Date()
        
        await Article.create({
          title: title,
          subtitle: item.author ? `来源: ${item.author}` : '',
          cover: cover || '',
          summary: summary,
          content: fullContent || '<p>内容加载失败</p>',
          category_id: category_id,
          type: type,
          points_required: type === 2 ? 10 : 0,
          status: autoPublish ? 1 : 0,
          publish_time: publishTime,
          view_count: 0,
          pay_count: 0,
          is_top: 0
        })
        
        results.success++
        results.details.push({
          title: title,
          status: 'success'
        })
        
      } catch (err) {
        results.fail++
        results.errors.push({
          title: item.title || `文章 ${index + 1}`,
          error: err.message
        })
        console.error('导入失败:', item.title, err.message)
      }
    }
    
    res.json({ 
      code: 0, 
      data: results,
      message: `成功导入 ${results.success} 篇，跳过 ${results.skipped} 篇（已存在），失败 ${results.fail} 篇`
    })
    
  } catch (error) {
    console.error('批量导入失败:', error)
    res.status(500).json({ code: 1, message: error.message || '批量导入失败' })
  }
})

// ============================================================
// 4. 抓取单个 URL 内容
// ============================================================
router.post('/fetch-url', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({ code: 1, message: '请提供 URL' })
    }
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    
    const $ = cheerio.load(response.data)
    
    const title = $('h1').first().text().trim() || $('title').text().trim()
    const cover = extractImage($, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'img[class*="cover"]',
      'img[class*="featured"]'
    ])
    
    const contentSelectors = ['article', '.content', '.post-content', '.entry-content']
    let content = ''
    for (const selector of contentSelectors) {
      const html = $(selector).html()
      if (html && html.length > 100) {
        content = html
        break
      }
    }
    
    const summary = $('meta[name="description"]').attr('content') || 
                    $('.summary').text().trim() || 
                    truncateSummary(extractText(content), 200)
    
    res.json({ 
      code: 0, 
      data: { 
        title, 
        cover, 
        summary, 
        content,
        url 
      } 
    })
  } catch (error) {
    console.error('抓取失败:', error)
    res.status(500).json({ code: 1, message: error.message || '抓取失败' })
  }
})

// ============================================================
// 5. 导入统计
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const total = await Article.count()
    const today = await Article.count({
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
    const byCategory = await Article.findAll({
      attributes: [
        'category_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category_id']
    })
    
    res.json({ 
      code: 0, 
      data: { total, today, byCategory } 
    })
  } catch (error) {
    res.status(500).json({ code: 1, message: error.message })
  }
})

// ============================================================
// 6. 批量导入 CSV/Excel
// ============================================================
router.post('/batch', auth, async (req, res) => {
  try {
    const { articles } = req.body
    
    if (!articles || articles.length === 0) {
      return res.status(400).json({ code: 1, message: '请提供文章数据' })
    }
    
    const results = { success: 0, fail: 0, errors: [] }
    
    for (const item of articles) {
      try {
        let category = await Category.findOne({
          where: { name: item.category_name }
        })
        
        if (!category) {
          category = await Category.create({
            name: item.category_name || '未分类',
            icon: '📚',
            status: 1
          })
        }
        
        const exist = await Article.findOne({
          where: { 
            title: item.title,
            status: 1
          }
        })
        
        if (exist) {
          results.fail++
          results.errors.push({ title: item.title, error: '文章已存在' })
          continue
        }
        
        await Article.create({
          title: item.title,
          subtitle: item.subtitle || '',
          cover: item.cover || '',
          summary: item.summary || '',
          content: item.content || '<p>内容加载失败</p>',
          category_id: category.id,
          type: item.type === '积分' ? 2 : 1,
          points_required: parseInt(item.points_required) || 0,
          status: 0,
          publish_time: new Date()
        })
        
        results.success++
      } catch (err) {
        results.fail++
        results.errors.push({ title: item.title, error: err.message })
      }
    }
    
    res.json({
      code: 0,
      data: results,
      message: `成功 ${results.success} 篇，失败 ${results.fail} 篇`
    })
  } catch (error) {
    console.error('批量导入失败:', error)
    res.status(500).json({ code: 1, message: '导入失败' })
  }
})

// ============================================================
// 7. RSS 预览（只解析不导入）
// ============================================================
router.post('/rss/preview', auth, async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({ code: 1, message: '请提供 RSS 地址' })
    }
    
    console.log('📡 预览 RSS:', url)
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    })
    
    const feed = await parser.parseString(response.data)
    console.log('📡 RSS 标题:', feed.title)
    console.log('📡 文章数量:', feed.items.length)
    
    const existingTitles = await Article.findAll({
      attributes: ['title'],
      where: { status: 1 }
    }).then(rows => rows.map(r => r.title))
    
    const items = feed.items.map(item => {
      const title = item.title || '无标题'
      const content = item.content || item['content:encoded'] || item.summary || ''
      const summary = item.summary || item.contentSnippet || content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
      const cover = item.enclosure?.url || item.image?.url || ''
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()
      const isDuplicate = existingTitles.includes(title)
      
      return {
        title: title,
        link: item.link || '',
        summary: summary,
        content: content,
        cover: cover,
        pubDate: pubDate.toISOString(),
        author: item.author || feed.title || '',
        isDuplicate: isDuplicate
      }
    })
    
    res.json({
      code: 0,
      data: {
        feedTitle: feed.title || '未知源',
        feedDescription: feed.description || '',
        total: items.length,
        items: items
      }
    })
    
  } catch (error) {
    console.error('❌ RSS 预览失败:', error.message)
    res.status(500).json({
      code: 1,
      message: error.message || 'RSS 解析失败，请检查地址是否正确'
    })
  }
})

// ============================================================
// 8. RSS 导入（传入选中的文章）
// ============================================================
router.post('/rss/import', auth, async (req, res) => {
  try {
    const { items, category_id, type = 1, autoPublish = false } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({ code: 1, message: '请选择要导入的文章' })
    }
    
    if (!category_id) {
      return res.status(400).json({ code: 1, message: '请选择目标分类' })
    }
    
    const category = await Category.findByPk(category_id)
    if (!category) {
      return res.status(404).json({ code: 1, message: '分类不存在' })
    }
    
    const results = { success: 0, fail: 0, skipped: 0, errors: [], items: [] }
    
    for (const item of items) {
      try {
        const title = item.title || '无标题'
        
        const exist = await Article.findOne({
          where: { 
            title: title,
            status: 1
          }
        })
        
        if (exist) {
          results.skipped++
          results.items.push({ title, status: 'skipped' })
          continue
        }
        
        const content = item.content || ''
        const summary = item.summary || content.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
        const cover = item.cover || ''
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()
        
        await Article.create({
          title: title,
          subtitle: `来源: RSS · ${item.author || ''}`,
          cover: cover,
          summary: summary,
          content: content || '<p>内容加载失败</p>',
          category_id: category_id,
          type: type,
          points_required: type === 2 ? 10 : 0,
          status: autoPublish ? 1 : 0,
          publish_time: pubDate,
          view_count: 0,
          pay_count: 0,
          is_top: 0
        })
        
        results.success++
        results.items.push({ title, status: 'success' })
        
      } catch (err) {
        console.error('❌ 导入失败:', err.message)
        results.fail++
        results.errors.push({ title: item.title || '未知', error: err.message })
      }
    }
    
    res.json({
      code: 0,
      data: results,
      message: `成功 ${results.success} 篇，跳过 ${results.skipped} 篇，失败 ${results.fail} 篇`
    })
    
  } catch (error) {
    console.error('❌ RSS 导入失败:', error.message)
    res.status(500).json({
      code: 1,
      message: error.message || '导入失败'
    })
  }
})

// ============================================================
// 9. 公众号文章预览（只抓取不导入）
// ============================================================
router.post('/wechat/preview', auth, async (req, res) => {
  try {
    const { urls } = req.body
    
    if (!urls || urls.length === 0) {
      return res.status(400).json({ code: 1, message: '请提供公众号文章链接' })
    }
    
    const results = []
    const existingTitles = await Article.findAll({
      attributes: ['title'],
      where: { status: 1 }
    }).then(rows => rows.map(r => r.title))
    
    for (const url of urls) {
      try {
        console.log('📱 预览公众号文章:', url)
        
        const articleData = await fetchWechatArticle(url)
        
        if (!articleData || !articleData.title) {
          results.push({
            url,
            title: '抓取失败',
            success: false,
            error: '抓取失败，请检查链接是否有效'
          })
          continue
        }
        
        const isDuplicate = existingTitles.includes(articleData.title)
        
        results.push({
          url,
          title: articleData.title,
          author: articleData.author || '未知作者',
          cover: articleData.cover || '',
          summary: articleData.summary || '',
          content: articleData.content || '',
          publishTime: articleData.publishTime || new Date(),
          isDuplicate,
          success: true
        })
        
      } catch (err) {
        console.error('❌ 预览失败:', err.message)
        results.push({
          url,
          title: '抓取失败',
          success: false,
          error: err.message
        })
      }
    }
    
    res.json({
      code: 0,
      data: {
        total: results.length,
        items: results
      }
    })
    
  } catch (error) {
    console.error('❌ 公众号预览失败:', error)
    res.status(500).json({ code: 1, message: '预览失败' })
  }
})

// ============================================================
// 10. 公众号文章导入（传入选中的文章）
// ============================================================
router.post('/wechat/import', auth, async (req, res) => {
  try {
    const { items, category_id, type = 1, autoPublish = false } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({ code: 1, message: '请选择要导入的文章' })
    }
    
    if (!category_id) {
      return res.status(400).json({ code: 1, message: '请选择目标分类' })
    }
    
    const category = await Category.findByPk(category_id)
    if (!category) {
      return res.status(404).json({ code: 1, message: '分类不存在' })
    }
    
    const results = { 
      success: 0, 
      fail: 0, 
      skipped: 0, 
      errors: [], 
      items: [] 
    }
    
    for (const item of items) {
      try {
        const exist = await Article.findOne({
          where: { 
            title: item.title,
            status: 1
          }
        })
        
        if (exist) {
          results.skipped++
          results.items.push({ 
            title: item.title, 
            success: false, 
            error: '文章已存在' 
          })
          continue
        }
        
        await Article.create({
          title: item.title,
          subtitle: `来源: 公众号 · ${item.author || '未知作者'}`,
          cover: item.cover || '',
          summary: item.summary || '',
          content: item.content || '<p>内容加载失败</p>',
          category_id: category_id,
          type: type,
          points_required: type === 2 ? 10 : 0,
          status: autoPublish ? 1 : 0,
          publish_time: item.publishTime || new Date(),
          view_count: 0,
          pay_count: 0,
          is_top: 0
        })
        
        results.success++
        results.items.push({ 
          title: item.title, 
          success: true 
        })
        
      } catch (err) {
        console.error('❌ 导入失败:', err.message)
        results.fail++
        results.errors.push({ title: item.title, error: err.message })
        results.items.push({ 
          title: item.title, 
          success: false, 
          error: err.message 
        })
      }
    }
    
    res.json({
      code: 0,
      data: results,
      message: `成功 ${results.success} 篇，跳过 ${results.skipped} 篇，失败 ${results.fail} 篇`
    })
    
  } catch (error) {
    console.error('❌ 公众号导入失败:', error)
    res.status(500).json({ code: 1, message: '导入失败' })
  }
})

module.exports = router