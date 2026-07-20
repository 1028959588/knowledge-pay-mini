// backend/src/api/crawler/zhihu.js

const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const { Article, Category } = require('../../models')
const router = express.Router()

// ============================================================
// 抓取知乎文章
// ============================================================
router.post('/fetch', async (req, res) => {
  try {
    const { urls, category_id, type = 1, autoPublish = false } = req.body
    
    if (!urls || urls.length === 0) {
      return res.status(400).json({ code: 1, message: '请提供 URL 列表' })
    }
    
    if (!category_id) {
      return res.status(400).json({ code: 1, message: '请选择目标分类' })
    }
    
    const results = { success: 0, fail: 0, skipped: 0, errors: [], items: [] }
    
    for (const url of urls) {
      try {
        console.log('📥 抓取:', url)
        
        // 提取知乎内容
        const articleData = await fetchZhihuArticle(url)
        
        if (!articleData) {
          results.fail++
          results.errors.push({ url, error: '抓取失败，请检查 URL' })
          continue
        }
        
        // 检查是否已存在
        const exist = await Article.findOne({
          where: { 
            title: articleData.title,
            status: 1
          }
        })
        
        if (exist) {
          results.skipped++
          results.items.push({ ...articleData, status: 'skipped', reason: '文章已存在' })
          continue
        }
        
        // 创建文章
        const article = await Article.create({
          title: articleData.title,
          subtitle: `来源: 知乎 · ${articleData.author || '未知作者'}`,
          cover: articleData.cover || '',
          summary: articleData.summary || '',
          content: articleData.content || '<p>内容加载失败</p>',
          category_id: category_id,
          type: type,
          points_required: type === 2 ? 10 : 0,
          status: autoPublish ? 1 : 0,
          publish_time: articleData.publishTime || new Date(),
          view_count: 0,
          pay_count: 0,
          is_top: 0
        })
        
        results.success++
        results.items.push({ ...articleData, id: article.id, status: 'success' })
        
      } catch (err) {
        console.error('❌ 抓取失败:', url, err.message)
        results.fail++
        results.errors.push({ url, error: err.message })
      }
    }
    
    res.json({
      code: 0,
      data: results,
      message: `成功 ${results.success} 篇，跳过 ${results.skipped} 篇，失败 ${results.fail} 篇`
    })
    
  } catch (error) {
    console.error('❌ 批量抓取失败:', error)
    res.status(500).json({ code: 1, message: '抓取失败' })
  }
})

// ============================================================
// 抓取单篇知乎文章
// ============================================================
async function fetchZhihuArticle(url) {
  try {
    // 知乎文章 URL 格式：
    // https://zhuanlan.zhihu.com/p/xxxxx
    // https://www.zhihu.com/question/xxxxx/answer/xxxxx
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cookie': process.env.ZHIHU_COOKIE || ''  // 可选，登录态 Cookie
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // 提取标题
    let title = $('h1').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') ||
                $('title').text().trim()
    
    // 提取作者
    let author = $('.AuthorInfo-name').text().trim() ||
                 $('.UserLink-link').text().trim() ||
                 $('meta[name="author"]').attr('content') ||
                 ''
    
    // 提取发布时间
    let publishTime = $('meta[property="article:published_time"]').attr('content') ||
                      $('.ContentItem-time').text().trim() ||
                      ''
    
    // 提取封面图
    let cover = $('meta[property="og:image"]').attr('content') ||
                $('img[class*="cover"]').attr('src') ||
                $('.RichMedia img').first().attr('src') ||
                ''
    
    // 提取摘要
    let summary = $('meta[property="og:description"]').attr('content') ||
                  $('.RichText p').first().text().trim() ||
                  ''
    
    // 提取正文（知乎文章内容在 .RichText 或 .Post-RichText 中）
    let content = ''
    
    // 知乎专栏文章
    let contentHtml = $('.Post-RichText').html() || $('.RichText').html()
    
    if (contentHtml) {
      // 清理内容
      content = cleanZhihuContent(contentHtml)
    } else {
      // 知乎问答
      const answerHtml = $('.RichContent-inner').html() || $('.AnswerItem .RichText').html()
      if (answerHtml) {
        content = cleanZhihuContent(answerHtml)
      }
    }
    
    // 如果没有内容，尝试用更通用的选择器
    if (!content) {
      content = $('article').html() || $('.content').html() || ''
    }
    
    // 清理内容中的无用元素
    content = cleanZhihuContent(content)
    
    // 如果没有标题，用 URL 作为标题
    if (!title) {
      title = '知乎文章_' + Date.now()
    }
    
    // 如果没有摘要，从内容中提取
    if (!summary) {
      summary = content.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
    }
    
    return {
      title: title,
      author: author,
      publishTime: publishTime ? new Date(publishTime) : new Date(),
      cover: cover,
      summary: summary,
      content: content,
      source: 'zhihu',
      sourceUrl: url
    }
    
  } catch (error) {
    console.error('❌ 抓取知乎文章失败:', error.message)
    return null
  }
}

// ============================================================
// 清理知乎内容
// ============================================================
function cleanZhihuContent(html) {
  if (!html) return ''
  
  // 移除 script 标签
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  
  // 移除 style 标签
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
  
  // 移除 noscript 标签
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
  
  // 移除知乎的版权声明
  html = html.replace(/<div[^>]*class="Copyright"[^>]*>[\s\S]*?<\/div>/gi, '')
  
  // 移除知乎的分享按钮等
  html = html.replace(/<div[^>]*class="[^"]*Share[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  
  // 移除知乎的评论区域
  html = html.replace(/<div[^>]*class="[^"]*Comment[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  
  // 移除空标签
  html = html.replace(/<[^>]*>\s*<\/[^>]*>/g, '')
  
  // 移除多余的空白行
  html = html.replace(/\n{3,}/g, '\n\n')
  
  return html
}

// ============================================================
// 预览知乎文章
// ============================================================
router.post('/preview', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({ code: 1, message: '请提供 URL' })
    }
    
    const data = await fetchZhihuArticle(url)
    
    if (!data) {
      return res.status(400).json({ code: 1, message: '抓取失败' })
    }
    
    res.json({
      code: 0,
      data: data
    })
    
  } catch (error) {
    console.error('❌ 预览失败:', error)
    res.status(500).json({ code: 1, message: '预览失败' })
  }
})

module.exports = router