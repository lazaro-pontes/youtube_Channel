const fs = require('fs')
const readLine = require('readline')
const { google } = require('googleapis')
require('dotenv').config()

//Lê as crendencias do arquivo JSON
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))

//Configura o OAuth2 client
const OAuth2Client = new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[0]

)

//Escopo de permissao necessário
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

//Função para obter token de acesso
const getNewToken = () => {
    const authUrl = OAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    })

    console.log('Autorize o app acessando esse link:', authUrl)

    const rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', async (code) => {
            rl.close
            try {
                const { tokens } = await OAuth2Client.getToken(code)
    
                OAuth2Client.setCredentials(tokens)
    
                console.log('Tokens Acquired')
    
                //salvar o token pra usar depois
                fs.writeFileSync(process.env.GOOGLE_APPLICATION_TOKEN, JSON.stringify(tokens))
                
                resolve()
            } catch (error) {
                console.error('Erro ao recuperar Token de Autenticação: ')
                reject(error)
            }
        })
    })
}

//verificar se ja existe token salvo
const checkToken = async () => {
    if (fs.existsSync(process.env.GOOGLE_APPLICATION_TOKEN)) {
        const tokens = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_TOKEN))

        OAuth2Client.setCredentials(tokens)

        console.log('token carregado com sucesso.')
    } else {
        await getNewToken()
    }
}

module.exports = { OAuth2Client, checkToken }