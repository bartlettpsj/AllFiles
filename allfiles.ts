
import * as util from 'util'
import * as path from 'path'
import * as crypto from 'crypto'
import * as bytes from 'bytes'
import * as fs2 from 'fs' // fs.d messed up for overloaded readdir by microsoft for promisify
const readdir = util.promisify(fs2.readdir);
const fsstat = util.promisify(fs2.stat);

// todo..
// Will add throttling so we dont blow open handles, kill system and perhaps add more order rather than depending on promises
// Would be great ifr we could go multi process.

import * as program from 'commander'; // 'commander');

interface FileMap {
    fullname: String;
    md5: String;
    size: number;
}

const filemap: FileMap[] = [];
let filecount = 0;
let fileprocess = 0;
let running: Boolean = false;
let bytecount: number = 0;

program
    .version('0.1.0')
    .option('-d, --directory <dir>', 'Specify the starting directory')
    .option('-r, --recursive', 'Recursively scan', false)
    .parse(process.argv);


const md5File = (filename: fs2.PathLike): Promise<String>  => {
    return new Promise(  (resolve, reject) => {
        const output = crypto.createHash('md5');
        const input = fs2.createReadStream(filename);

        input.on('error', function (err) {
            reject(err)
        });

        output.once('readable', function () {
            resolve(output.read().toString('hex'))
        });

        input.pipe(output)
    })
};

const getDirectory = async (path_in: string) => {
    const files = await readdir(path_in, { withFileTypes: true });

    console.table(files);

    // process many files concurrently -- no throlling on size of dir!
    files.forEach(async dirent => {
        const fullname = path.join(path_in, dirent.name);
        if (dirent.isDirectory()) {
            console.log('%s is a directory', dirent.name);
            getDirectory(fullname);
        } else {
            running = true;
            console.log('%s is a file', dirent.name);
            filecount++;

            // Calc MD5 and add to filemap
            const md5 = await md5File(fullname);
            const stat = await fsstat(fullname);
            const { size } = stat;
            console.log('%s: %s', fullname, md5);
            console.log('File %s size %d', fullname, size);

            filemap.push({ fullname, md5, size });
            fileprocess++;
            bytecount += size;
            running = false;
        }
    })
}

const monitor = () => {
    const timer = setInterval( () => {
        if (!running && filecount == fileprocess) {
            console.log('DONE: after processing %d files total size %s', filecount, bytes(bytecount));
            clearInterval(timer);
        }
    }, 1000);
}

if (program.directory) {
    const path = program.directory;
    getDirectory(path);

    monitor();
} else {
    console.log('Error: Directory is missing');
}
