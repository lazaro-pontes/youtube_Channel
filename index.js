const fs = require('fs')
const { google } = require('googleapis')
const { OAuth2Client, checkToken } = require('./auth')
require('dotenv').config()


const youtube = google.youtube({
    version: 'v3',
    auth: OAuth2Client,
})

//Função para fazer o upload do vídeo
const uploadVideo = async (filePath, title, description, tags, categoryId) => {
    //Checa se o token ja está salvo ou solicita autorização
    await checkToken()

    const request = {
        part: 'snippet,status',
        resource: {
            snippet: {
                title: title,
                description: description,
                tags: tags,
                categoryId: categoryId
            },
            status: {
                privacyStatus: 'public'
            },
        },
        media: {
            body: fs.createReadStream(filePath)
        },
    }
    
    try {
        const response = await youtube.videos.insert(request)
    
        console.log(`Upload realizado com sucesso: ${response.data.videos}`)

        //Retorna link do video
        const videoId = response.data.id
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
        return videoUrl

    } catch (error) {
        console.error('Erro ao realizar o upload: ', error)
    }
}

//Exemplo
const filePath = './output/part-3.mp4'
const title = 'Bookie episodio 1'
const description = 'serie do Charlie de dois homens e meio'
const tags = ['shorts', 'DoisHomensE_Meio']
const categoryId = 1 //Id de categoria Film & Animation

uploadVideo(filePath, title, description, tags, categoryId)