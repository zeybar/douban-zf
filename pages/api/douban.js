// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// export default function handler(req, res) {
//   res.status(200).json({ name: 'John Doe' })
// }

const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

/**
 * /discussion?start=0&type=new 每页25
 */
// 深圳租房 https://www.douban.com/group/szsh/
// 南山租房 https://www.douban.com/group/nanshanzufang/
// 福田租房 https://www.douban.com/group/futianzufang/  
// 宝安租房 https://www.douban.com/group/baoanzufang/
// 罗湖租房 https://www.douban.com/group/592828/
// 龙岗租房 https://www.douban.com/group/longgangzufang/
// 深圳租房 https://www.douban.com/group/SZhouse/
// 深圳租房 https://www.douban.com/group/luohuzufang/
// 深圳租房 https://www.douban.com/group/637628/
// 深圳租房 https://www.douban.com/group/609271/
// 深圳租房 https://www.douban.com/group/648540/
// 深圳租房 https://www.douban.com/group/653972/
// 深圳租房 https://www.douban.com/group/609272/
// 深圳租房 https://www.douban.com/group/653967/
// 深圳租房 https://www.douban.com/group/613105/

const groups = [
  {
    name: '深圳租房',
    group: 'szsh'
  },
  {
    name: '南山租房',
    group: 'nanshanzufang'
  },
  {
    name: '福田租房',
    group: 'futianzufang'
  },
  {
    name: '宝安租房',
    group: 'baoanzufang'
  },
  {
    name: '罗湖租房',
    group: '592828'
  },
  {
    name: '龙岗租房',
    group: 'longgangzufang'
  },
  {
    name: '深圳租房',
    group: 'SZhouse'
  },
  {
    name: '深圳租房',
    group: 'luohuzufang'
  },
  {
    name: '深圳租房',
    group: '637628'
  },
  {
    name: '深圳租房',
    group: '609271'
  },
  {
    name: '深圳租房',
    group: '609272'
  },
  {
    name: '深圳租房',
    group: '648540'
  },
  {
    name: '深圳租房',
    group: '653972'
  },
  {
    name: '深圳租房',
    group: '653967'
  },
  {
    name: '深圳租房',
    group: '613105'
  },
]
const groupMap = Object.fromEntries(groups.map(item => [item.group, item.name]))
const PREFIX = 'https://www.douban.com/group/'
const headers = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  Cookie: 'bid=pw1CI1kCGpg; _pk_id.100001.8cb4=ea5c6b32feff65be.1689124929.; __utmc=30149280; __utmz=30149280.1689124930.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); dbcl2="61161399:WFF03jET/44"; ck=SBGs; __yadk_uid=Hd7gwAGXHDLPYyZb5my3eZksX5A0URN2; push_noty_num=0; push_doumail_num=0; __utmv=30149280.6116; _pk_ref.100001.8cb4=%5B%22%22%2C%22%22%2C1689142542%2C%22https%3A%2F%2Fwww.google.com%2F%22%5D; _pk_ses.100001.8cb4=1; frodotk_db="0e611d35b6c426112b2357a1244c7233"; __utma=30149280.2048356203.1689124930.1689131904.1689142544.3; ap_v=0,6.0; ct=y; __utmt=1; __gads=ID=fe920a7aed2716ae-22922ecb50e200f0:T=1689131900:RT=1689145925:S=ALNI_Mbkb4qZDpQtEQAih9rqy_qbwjoJXQ; __gpi=UID=00000c1ffaf0928e:T=1689131900:RT=1689145925:S=ALNI_MYSvRQHywK9HB6Ck_oy2d_hU5rkNQ; __utmb=30149280.309.4.1689145994673; bid=N-Pl85R--Tg', // 和cookie一样这个需要登录后自己看请求接口并做替换,如果过期请自己替换
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
}
// 步长
const STEP = 25

const pageSize = 10

const shieldWords = '限女,限女生,求租'

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(true), time))


const readDb = (path) => fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : []

const getDoubanGroup = (group, page = 0) => new Promise((resolve) => {

  const url = `${PREFIX}${group}/discussion?start=${page * STEP}&type=new`
  axios.get(url, { headers })
    .then(async (res) =>{
      const html = res.data
      const $ = cheerio.load(html)
      const result = []
      const trList = Array.from($('.olt tr').slice(1))
      for(let [index, el] of trList.entries()) {
        const title = $(el).find('td').eq(0).find('a').eq(0).text().trim()
        const url = $(el).find('td').eq(0).find('a').eq(0).attr('href')
        const username = $(el).find('td').eq(1).find('a').eq(0).text()
        const time = $(el).find('td').eq(3).text()
        const contentRes = await axios.get(url, { headers })
        const contentHtml = contentRes.data
        const $$ = cheerio.load(contentHtml)
        const content = $$('.rich-content').text().trim()
        const imgList = Array.from($$('.rich-content img').map((i, el) => $$(el).attr('src')))
        result.push({ title, url, username, time, content, imgList, index })
      }
      resolve(result)
    })
    .catch((e) => {
      console.log('error', e)
    })
})

const writeDBData = async (group, page) => {
  const filePath = path.join(process.cwd(), `/public/db/${group}/douban_${page}.json`)
  // if (fs.existsSync(filePath)) {
  //   console.log(`已经获取过了，如果不是强制获取，就不重新操作了${group}_${page}`)
  //   return
  // }
  let result = await getDoubanGroup(group, page)
  const shieldList = shieldWords.split(',')
  result = result.filter((item) => !shieldList.some(shield => (item.title.includes(shield) || item.content.includes(shield))))
  console.log(`获取 ${groupMap[group]}/${group}, 第${page}页，数据成功！`)
  const dirdb = path.join(process.cwd(), '/public/db')
  const dir = path.join(process.cwd(), `/public/db/${group}`)
  if (!fs.existsSync(dirdb)) {
    fs.mkdirSync(dirdb)
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  // const filePath = path.join(process.cwd(), `/public/db/${group}/douban_${page}.json`) // static下创建
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`写入 ${groupMap[group]}/${group}, 第${page}页，数据成功！`)
}

const pageArr = Array.from({ length: 10 }).map((_, idx) => idx)

const getAllGroup = async () => {
  for (let group of groups) {
    for (let page of pageArr) {
      await writeDBData(group.group, page)
      await sleep(1000)
    }
    concatData(group.group)
  }
  console.log('爬取全部页面完成~！')
}

function createFolderRecursive(folderPath) {
  if (!fs.existsSync(folderPath)) {
    // 如果当前文件夹不存在，则先递归创建其父文件夹
    createFolderRecursive(path.dirname(folderPath));

    // 创建当前文件夹
    fs.mkdirSync(folderPath);
    console.log(`${folderPath} 已创建`);
  }
}

// 定义递归删除文件夹的函数
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    // 获取文件夹中的所有文件名和子文件夹名
    const fileNames = fs.readdirSync(folderPath);

    // 逐一处理每个文件和子文件夹
    fileNames.forEach(fileName => {
      const filePath = path.join(folderPath, fileName);

      if (fs.statSync(filePath).isDirectory()) {
        // 如果当前项是文件夹，则递归删除其中的文件和子文件夹
        deleteFolderRecursive(filePath);
      } else {
        // 否则，直接删除该文件
        fs.unlinkSync(filePath);
        console.log(`${filePath} 已删除`);
      }
    });

    // 删除当前文件夹
    fs.rmdirSync(folderPath);
    console.log(`${folderPath} 已删除`);
  }
}

const concatData = (group) => {
  const dir = path.join(process.cwd(), `/public/db/${group}`)
  const fileNames = fs.readdirSync(dir)
  let result = []
  fileNames.forEach(fileName => {
    const filePath = path.join(process.cwd(), `/public/db/${group}`, `/${fileName}`)
    const list = readDb(filePath)
    result = [...result, ...list]
  });
  result = result.map((item, index) => ({ ...item, index }))
  const resPath = path.join(process.cwd(), `/public/db/${group}`, '/douban.json')
  fs.writeFileSync(resPath, JSON.stringify(result, null, 2), 'utf-8')
}

export default async function handler(req, res) {
  if (req.query.type === 'all') {
    console.log('要重新爬')
    // deleteFolderRecursive(path.join(process.cwd(), '/public/db'))
    // console.log('删除成功')
    await getAllGroup()
    res.status(200).json({ code: 0 })
    return
  }

  if (req.query.searchVal) {
    console.log(req.query)
    const queryList = req.query.searchVal.split(',')
    let result = []
    for (let group of groups) {
      const filePath = path.join(process.cwd(), `/public/db/${group.group}/douban.json`)
      if (fs.existsSync(filePath)) {
        const list = readDb(filePath)
        result = [...result, ...list]
      }
    }
    const list = result.filter(item => queryList.some(query => item.title.includes(query) || item.content.includes(query)))
    res.status(200).json({ list })
    return
  }
  // if (req.query.page) {
  //   const filePath = path.join(process.cwd(), `/public/db/szsh/douban_${req.query.page - 1}.json`)
  //   res.status(200).json({ list: readDb(filePath) })
  //   return
  // }
  const filePath = path.join(process.cwd(), '/public/db/szsh/douban.json')
  const list = readDb(filePath)
  res.status(200).json({ list })
}
