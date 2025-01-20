const { exec } = require('child_process')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

//Função para obter o tamanho de um arquivo
function getFileSize(filePath) {
    const stats = fs.statSync(filePath)
    return (stats.size / (1024 * 1024)).toFixed(2) //Tamanho em MB
}


//função para dividir o vídeo
async function splitVideo(inputFile, outputDir) {
    //verificar se o arquivo de entrada existe
    if (!fs.existsSync(inputFile)) {
        console.log('Arquivo de entrada não encontrado!', inputFile)
        return
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir)
    }

    //obter duraçãototal do vídeo
    const getVideoDuration = () => {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputFile, (err, metadata) => {
                if (err) {
                    reject(err)
                }
                const duration = metadata.format.duration //Duração em segundos

                resolve(duration)
            })
        })
    }

    //Obtém a resolução do video
    const getVideoResolution = (inputFile) => {
        return new Promise((resolve, reject) => {
            const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${inputFile}"`
            exec(command, (error, stdout) => {
                if (error) {
                    return reject(`Erro ao obter resolução: ${error.message}`)
                }
                const info = JSON.parse(stdout)
                const width = info.streams[0].width
                const height = info.streams[0].height
                resolve({ width, height })
            })
        })
    }

    //calcula os parametros de crop
    const calculateCrop = (width, height) => {
        const targetAspect = 9 / 16

        //se o video é mais largo que 9/16
        if (width / height > targetAspect) {
            const newWidth = Math.floor(height * targetAspect)
            const xOffset = Math.floor((width - newWidth) / 2)

            return `crop=${newWidth}:${height}:${xOffset}:0`
        }

        //Se o video for mais alto que 9/16
        const newHeight = Math.floor(width / targetAspect)
        const yOffset = Math.floor((height - newHeight) / 2)

        return `crop=${width}:${newHeight}:${yOffset}`
    }

    try {
        const duration = await getVideoDuration()
        console.log(`Duração total do video: ${Math.ceil(duration) / 60} minutos`)

        //Obter resolução do video
        const { width, height } = await getVideoResolution(inputFile)
        const aspectFilter = await calculateCrop(width, height)

        //dividir o video em trechos de 1 minuto
        const segmentDuration = 59 //60 seg (1 min)
        let startTime = 0
        let part = 1
        let totalSize = 0


        while (startTime < duration) {
            const outputFile = path.join(outputDir, `part-${part}.mp4`)

            console.log(`Cortando trecho ${part}: Inicio ${startTime}s`)


            await new Promise((resolve, reject) => {
                ffmpeg(inputFile)
                    .setStartTime(startTime)
                    .setDuration(segmentDuration)
                    .videoFilters([ //Formato e detecção de cena
                        aspectFilter, //Ajuste para 9:16
                        'scale=1080:1920',//Ajuste para a resolução do youtube
                        // 'select=gt(scene\,0.4)' //Detecta mundanças de cena (ajusta a sensibilidade)
                    ])
                    .audioCodec('copy')
                    .output(outputFile)
                    .on('end', () => {
                        console.log(`Trecho ${part} salvo como ${outputFile}`)

                        const fileSize = getFileSize(outputFile)
                        totalSize += parseFloat(fileSize)
                        console.log(`Tamanho do trecho ${part}: ${fileSize} MB`)

                        resolve()
                    })
                    .on('error', (err) => {
                        console.log(aspectFilter)
                        console.log(`Erro ao salvar trecho ${part}: `, err)
                        reject(err)
                    })
                    .run()
            })

            startTime += segmentDuration
            part++
        }

        console.log('Divisão concluída! Tamanho total dos trechos:', totalSize)
    } catch (err) {
        console.error('Erro ao dividir o video: ', err)
    }
}

// Exemplo de uso
const inputFile = process.argv[2] || 'input.mp4'
const outputDir = process.argv[3] || process.env.OUTPUT_DIR || 'output'

splitVideo(inputFile, outputDir)