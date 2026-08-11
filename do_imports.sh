ts-node ./src/backend/importer/import_files.ts --game genshin --deobf-excel
ts-node ./src/backend/importer/import_files.ts --game genshin --deobf-bin
ts-node ./src/backend/importer/import_files.ts --game genshin --make-excels
cd /c/Shared/git/GenshinData/ExcelBinOutput
rsync -avP ./ sacch:/home/saccharose/data/GenshinData/ExcelBinOutput/
cd /c/Shared/git/localweb/Saccharose
ts-node ./src/backend/importer/import_files.ts --game genshin --normalize-tm
ts-node ./src/backend/importer/import_files.ts --game genshin --normalize-ex
ts-node ./src/backend/importer/import_files.ts --game genshin --plaintext
ts-node ./src/backend/importer/import_files.ts --game genshin --voice-items
ts-node ./src/backend/importer/import_files.ts --game genshin --interaction
ts-node ./src/backend/importer/import_files.ts --game genshin --gcg-skill
ts-node ./src/backend/importer/import_files.ts --game genshin --new-images
ts-node ./src/backend/importer/import_files.ts --game genshin --index-images cat_map_only
