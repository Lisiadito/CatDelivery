const TelegramBot = require('node-telegram-bot-api')
const https = require('https')
const xml2js = require('xml2js')

const telegramToken = <TELEGRAM API KEY>
const catToken = <CAT API KEY>

const catApiAdr = `https://api.thecatapi.com/api/images/get?format=xml&results_per_page=1&size=med&api_key=${catToken}`

const catCategoryAdr = 'https://api.thecatapi.com/api/categories/list'

const parser = new xml2js.Parser({explicitArray : false, mergeAttrs : true})

const bot = new TelegramBot(telegramToken, {polling: true})

let categories = []

getCategories()

function callACat(url, person, chatId) {
	https.get(url, result => {
		let dataString = ''
		result.on('data', (data) => {
		  	dataString += data
		})

		result.on('end', () => {
			parser.parseString(dataString, (err, result) => {
				if(result.response.data.images) {
					bot.sendMessage(chatId, `${person} here is your cat ${result.response.data.images.image.url}`)
				} else {
					bot.sendMessage(chatId, 'Something went wrong =(. Looks like their are no pictures in that category')
				}
				
			})
			dataString = ''
	})
	}).on('error' , (error) => {
		console.log("[*] Error Caught: " + error)
	})
}

function getCategories() {
  	https.get(catCategoryAdr, result => {
		let dataString = ''
		result.on('data', (data) => {
		  	dataString += data
		})

		result.on('end', () => {
			parser.parseString(dataString, (err, result) => {
				//check for error
				categories = []
				result.response.data.categories.category.forEach(elem => categories.push(elem.name))	
			})
			dataString = ''
	})
	}).on('error' , (error) => {
		console.log("[*] Error Caught: " + error)
	})
}


bot.onText(/^\/cat$/, (msg, match) => {
  	const chatId = msg.chat.id;
  	const person = msg.from.first_name
  	callACat(catApiAdr, person, chatId)
})

bot.onText(/\/cat\/.+/, (msg, match) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name
  const wish = match[0].substring(5)
  if(categories.includes(wish)) {
  	callACat(catApiAdr + `&category=${wish}`, person, chatId)
  } else {
  	bot.sendMessage(chatId, `Sorry ${person} there is no *${wish}* category`, {parse_mode: 'markdown'})
  }
})


bot.onText(/\/help/, (msg, match) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name
  getCategories()
  bot.sendMessage(chatId, `Hello ${person} \nto order a random cat type \n*/cat* \nTo order a random cat from a certain category type \n*/cat/CATEGROY* \nThese are the categories you can specify: \n*${categories.join('\n')}* \n`, {parse_mode: 'markdown'})
})


