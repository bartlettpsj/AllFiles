const fs = require('fs').promises;
const program = require('commander');

console.log('hello');

program
    .version('0.1.0')
    .option('-d, --directory <dir>', 'Specify the starting directory')
    .option('-r, --recursive', 'Recursively scan', false)
    .parse(process.argv);


const getDirectory = async (path) => {
    const files = await fs.readdir(path, {withFileTypes: true});
    console.table(files);

    files.forEach(dirent => {
        if (dirent.isDirectory()) {
            console.log('%s is a directory', dirent.name);
        } else {
            console.log('%s is a file', dirent.name);
        }
    })
}

if (program.directory) {
    const path = program.directory;
    getDirectory(path);
} else {
    console.log('Error: Directory is missing');
}

console.log('Directory is %s', program.directory);
console.log('Recursive is %s', program.recursive);

