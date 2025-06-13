import { readdir, stat, unlink, open } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { platform } from 'process'
import fs from 'fs'

const TIME = 1000 * 60 * 3

async function clearTmp() {
    if (!fs.existsSync(global.tempDir)) {
        fs.mkdirSync(global.tempDir)
    }

    const tmpDirs = [tmpdir(), global.tempDir]

    const promises = tmpDirs.map(async (dir) => {
        try {
            const files = await readdir(dir)
            const currentTime = Date.now()

            await Promise.all(files.map(async (file) => {
                const filePath = join(dir, file)
                const fileStat = await stat(filePath)

                if (fileStat.isFile() && (currentTime - fileStat.mtimeMs >= TIME)) {
                    if (platform === 'win32') {
                        let fileHandle
                        try {
                            fileHandle = await open(filePath, 'r+')
                        } catch (e) {
                            console.error('[clearTmp]', e, 'Skipping', filePath)
                            return e
                        } finally {
                            await fileHandle?.close()
                        }
                    }

                    await unlink(filePath)
                }
            }))
        } catch (e) {
            console.error('[clearTmp]', e, 'Skipping', dir)
            return e
        }
    })

    return await Promise.allSettled(promises)
}

export default clearTmp