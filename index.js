const readLine = require('readline-sync')


function start () {
    const content = []

    content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()

    function askAndReturnSearchTerm () {
        return readLine.question('Pesquise um termo na wikipedia: ')

    }

    function askAndReturnPrefix() {
        const prefixes = ['Quem e?', 'O que e?', 'A historia de']
        const selectedPrefixIndex =  readLine.keyInSelect(prefixes, 'Escolha uma opcao: ')
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText
    }

    console.log(content)
}

start()