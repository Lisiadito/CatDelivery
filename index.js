process.env["NTBA_FIX_319"] = 1;
require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const got = require('got');

const telegramToken = process.env.TELEGRAMAPITOKEN
const catToken = process.env.CATAPITOKEN

const baseUrl = 'https://api.thecatapi.com/v1'
const bot = new TelegramBot(telegramToken, {polling: true})

const categories = []
const breeds = []

// initial call
getCategories()
getBreeds()

function callACat(url, person, chatId, searchParams) {
	got(url, {baseUrl, headers: {'x-api-key': catToken}, json: true, searchParams}).then(res => {
		if (res.body.length > 0 && res.body[0].url){
			const imgUrl = res.body[0].url
			bot.sendMessage(chatId, `${person} here is your cat ${imgUrl}`)
		} else {
			bot.sendMessage(chatId, `Sorry ${person} something went wrong. No cat for you =(`)
		}
	}).catch(e => {
		console.error(`[*] Error Caught: ${e}`)
	})
}

async function getCategories() {
	try {
		const response = await got('/categories', {baseUrl, json: true})
		for (const category of response.body) {
			categories.push({name: category.name, id: category.id})
		}
	} catch (e) {
		console.error(`[*] Error Caught: ${e}`)	
	}
}

async function getBreeds() {
	try {
		const response = await got('/breeds', {baseUrl, json: true})
		for (const breed of response.body) {
			breeds.push({name: breed.name, id: breed.id})
		}
	} catch (e) {
		console.error(`[*] Error Caught: ${e}`)		
	}	
}

bot.onText(/^\/cat$/, (msg, match) => {
  	const chatId = msg.chat.id;
  	const person = msg.from.first_name
  	callACat('/images/search', person, chatId)
})

bot.onText(/\/category\/.+/, (msg, match) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name
  const wish = match[0].substring(10)
  const category = categories.find(elem => elem.name == wish)
  if(category) {
  	const searchParams = new URLSearchParams([['category_ids', category.id]])
  	callACat('/images/search', person, chatId, searchParams)
  } else {
  	bot.sendMessage(chatId, `Sorry ${person} there is no *${wish}* category`, {parse_mode: 'markdown'})
  }
})

bot.onText(/\/breed\/.+/, (msg, match) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name
  const wish = match[0].substring(7)
  const breed = breeds.find(elem => elem.name == wish)
  if(breed) {
  	const searchParams = new URLSearchParams([['breed_id', breed.id]])
  	callACat('/images/search', person, chatId, searchParams)
  } else {
  	bot.sendMessage(chatId, `Sorry ${person} there is no *${wish}* breed`, {parse_mode: 'markdown'})
  }
})

bot.onText(/\/help/, (msg, match) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name
  		bot.sendMessage(chatId, `Hello ${person} \nto order a random cat type \n*/cat* \n
  			To order a random cat from a certain category type eg. \n*/category/boxes* \n
  			To order a random cat from a certain breed \n*/breed/Sphynx* \n
  			To get a list of categories or breeds type \n*/help/categories or /help/breeds* \n
  			`, {parse_mode: 'markdown'})  	
})

bot.onText(/\/help\/categories/, (msg, match) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name
  getCategories().then( () => {
  		bot.sendMessage(chatId, `Hello ${person} \n
  		These are the categories you can specify: \n*${categories.map(category => category.name).join('\n')}* \n`, {parse_mode: 'markdown'})  	
  })
})

bot.onText(/\/help\/breeds/, (msg, match) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name
  getBreeds().then( () => {
  		bot.sendMessage(chatId, `Hello ${person} \n
  		These are the categories you can specify: \n*${breeds.map(category => category.name).join('\n')}* \n`, {parse_mode: 'markdown'})  	
  })
})