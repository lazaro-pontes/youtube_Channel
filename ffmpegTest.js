const ffmpeg =  require('fluent-ffmpeg')

//verificar se o FFmpeg está disponivel
ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
        console.log('Erro ao verificar o ffmpeg: ', err)
    }else {
        console.log('O FFmpeg está funcionando! Formatos disponíveis: ', formats)
    }
})