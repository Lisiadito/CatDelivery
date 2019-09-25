process.env['NTBA_FIX_319'] = 1;
require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const got = require('got');
const _ = require('lodash')

const telegramToken = process.env.TELEGRAMAPITOKEN
const catToken = process.env.CATAPITOKEN

const baseUrl = 'https://api.thecatapi.com/v1'
const bot = new TelegramBot(telegramToken, {polling: true})

const inline_keyboard_categories = []
const inline_keyboard_breeds = []
const inline_keyboard = [ [
	{
		text: 'Random cat',
		callback_data: 'random'
	},
	{
		text: 'List of categories',
		callback_data: 'categories'
	},
	{
		text: 'List of breeds',
		callback_data: 'breeds'
	}
]]


function callACat(url, person, chatId, searchParams) {
	got(url, {baseUrl, headers: {'x-api-key': catToken}, json: true, query: searchParams} ).then(res => {
		if (res.body.length > 0 && res.body[0].url){
			const imgUrl = res.body[0].url
			void bot.sendMessage(chatId, `${person} here is your cat ${imgUrl}`)
		} else {
			void bot.sendMessage(chatId, `Sorry ${person} something went wrong. No cat for you =(`)
		}
	}).catch(e => {
		console.error(`[*] Error Caught: ${e}`)
	})
}

async function getCategories() {
	resetKeyboard(inline_keyboard_categories)
	try {
		const response = await got('/categories', {baseUrl, json: true})
		fillKeyboard(response.body, inline_keyboard_categories)
	} catch (e) {
		console.error(`[*] Error Caught: ${e}`)
	}
}

async function getBreeds() {
	resetKeyboard(inline_keyboard_breeds)
	try {
		const response = await got('/breeds', {baseUrl, json: true})
		fillKeyboard(response.body, inline_keyboard_breeds)
	} catch (e) {
		console.error(`[*] Error Caught: ${e}`)
	}
}

function resetKeyboard(keyboard) {
	keyboard.length = 0
	keyboard.push([])
}

function fillKeyboard(data, keyboard) {
	let counter = 0
	for (const [index, entry] of data.entries()) {
		if(index%3 !== 0 || index === 0) {
			keyboard[counter].push({text: entry.name, callback_data: entry.id.toString()})
		} else {
			keyboard.push([])
			counter++
			keyboard[counter].push({text: entry.name, callback_data: entry.id.toString()})
		}
	}
}

bot.on('callback_query', query => {
	const {message: {chat}, from} = query

	switch (query.data) {
		case 'breeds': getBreeds().then(() => {
			void bot.sendMessage(chat.id, 'Available breeds', {
				reply_markup: {
					inline_keyboard: inline_keyboard_breeds
				}
			})
		}); break
		case 'categories': getCategories().then(() => {
			void bot.sendMessage(chat.id, 'Available categories', {
				reply_markup: {
					inline_keyboard: inline_keyboard_categories
				}
			})
		}); break
		case 'random': callACat('/images/search', from.first_name, chat.id); break
	}

	const category = _.flattenDeep(inline_keyboard_categories).find(elem => elem.callback_data === query.data)
	if (category) {
		const searchParams = new URLSearchParams([['category_ids', category.callback_data]])
		callACat('/images/search', from.first_name, chat.id, searchParams)
	}

	const breed = _.flattenDeep(inline_keyboard_breeds).find(elem => elem.callback_data === query.data)
	if (breed) {
		const searchParams = new URLSearchParams([['breed_id', breed.callback_data]])
		callACat('/images/search', from.first_name, chat.id, searchParams)
	}

	void bot.answerCallbackQuery(query.id)
})

bot.onText(/^\/cat$/, (msg) => {
	const chatId = msg.chat.id;
	const person = msg.from.first_name
	callACat('/images/search', person, chatId)
})

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const person = msg.from.first_name

	void bot.sendMessage(chatId, `Hey ${person} pick one option:`, {
		reply_markup: {
			inline_keyboard
		}
	})
})
