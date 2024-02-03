# Saccharose.wiki

**Saccharose.wiki** is a web app that provides various tools to auto-generate wikitext for use by the editors of the
[Genshin Impact Fandom Wiki](https://genshin-impact.fandom.com/wiki/Genshin_Impact_Wiki)

## Prerequisites

- Git
- Node.js
- Python 3
- PIP package: `pycld2`
  - On Linux, run: `pip install pycld2`
  - On Windows, pip installing does not work!
    
    Instead, clone [the repo](https://github.com/aboSamoor/pycld2), `cd` into it, and run `./setup.py install` as admin.

### Optional Prerequisites

This is only necessary to be installed if you plan to use or develop the "media-search" functionality.

- PostgreSQL (must be installed in a Linux system)
  1. On Windows, install in WSL: https://learn.microsoft.com/en-us/windows/wsl/install-manual
  2. Install PostgreSQL https://www.postgresql.org/download/linux/ubuntu/
  3. Modify `postgresql.conf` and set `listen_addresses = '*'`
  4. In WSL, install apt packages: `make`, `build-essential` (Linux should already have these)
- Other PIP packages: `imagehash`, `psycopg2`, `python-dotenv`
  - On Linux, having PostgreSQL installed is required to install `psycopg2`
  - On Linux, you'll need to apt-get install `libpq-dev` and `python3-dev` first to install psycopg2.
  - On Windows, you can install these in Windows, not WSL
- Install `pg-spgist_hamming` on the system with PostgreSQL installed (https://github.com/fake-name/pg-spgist_hamming)
  - First run: `sudo apt install postgresql-server-dev-XX`
    - Replace `XX` with your installed version of PostgreSQL
  - Follow instructions:
    ```
    cd bktree
    make
    sudo make install
    ```

## Setup

1. Clone the repo from GitHub (`git clone git@github.com:kwwxis/Saccharose.git`)
2. Run `npm install` in the repo
3. If on Windows, run this command to configure Bash as the script shell:

   - 32bit: `npm config set script-shell "C:\\Program Files (x86)\\git\\bin\\bash.exe" `
   - 64bit: `npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

4. Copy `.env.example` to new file `.env` and configure it according to the comments and this readme.

### shell setup
       
**Bash** is required for this program to run in all operating systems, specifically it
uses the `grep` command. 

So you must specify a `SHELL_PATH` and `SHELL_EXEC` in the `.env` file.

If you're on Linux/Unix, you should already have Bash. But on Windows,
it's recommended that you install [Git Bash](https://git-scm.com/downloads).

After installing Git Bash, you can configure the follow:
 - On Windows:
    ```dotenv
    SHELL_PATH='/mingw64/bin:/usr/local/bin:/usr/bin:/bin:/mingw64/bin:/usr/bin'
    SHELL_EXEC='C:/Program Files/Git/usr/bin/bash.exe'
    ```
 - On Linux:
    ```dotenv
    SHELL_PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
    SHELL_EXEC=/bin/bash
    ```

### SSL setup
       
This project can be run both with and without SSL. For local development, it doesn't really
matter much, so if you're having trouble getting SSL working or don't want to bother, then you can just skip it.

1. Create a file called `openssl.<VHOST>.cnf` with these contents.
   
   Replace `<VHOST>` in the file name and the file contents with the `VHOST` in your `.env` file.
   
   ```
   authorityKeyIdentifier=keyid,issuer
   basicConstraints=CA:FALSE
   keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
   subjectAltName=DNS:<VHOST>
   ```

2. Run `openssl genrsa -des3 -out rootSSL.key 2048`. It'll ask you to create a password, only you're using this
   password so it doesn't need to be a very good password but make sure you remember it as you'll be asked to
   re-enter this password in later commands.

3. Run `openssl req -x509 -new -nodes -key rootSSL.key -sha256 -days 1024 -out rootSSL.pem`. It'll give you a
   questionnaire, fill it out appropriately. For the "Common Name" question, give it a decent name so you know
   what it's for (e.g. "Self-Signed Local Certificate").

   The rootSLL.pem will expire after 1024 days, so you'll need to repeat this process when it expires.
   Alternatively, you can set `-days 1024` to a higher number when you run the command.

4. Run this command. It's multi-line so if your terminal asks if you're sure you want to paste it, then say yes.
   
   Remember to replace `<VHOST>`
   
   ```shell
   openssl req \
    -new -sha256 -nodes \
    -out <VHOST>.csr \
    -newkey rsa:2048 -keyout <VHOST>.key \
    -subj "//C=<2LetterCountryCode>\ST=<StateFullName>\L=<CityFullName>\O=<OrganizationName>\OU=<OrganizationUnitName>\CN=<VHOST>\emailAddress=<EmailAddress>"
   ```
   Example for the last line:
   ```
   -subj "//C=US\ST=Washington\L=Seattle\O=kwwxis\OU=kwwxis\CN=<VHOST>\emailAddress=kwwxis@gmail.com"
   ```
5. Run this command.
   
   Remember to replace `<VHOST>`
   
   ```shell
   openssl x509 \
    -req \
    -in <VHOST>.csr \
    -CA rootSSL.pem -CAkey rootSSL.key -CAcreateserial \
    -out <VHOST>.crt \
    -days 500 \
    -sha256 \
    -extfile openssl.<VHOST>.cnf
   ```
6. Edit the `.env` file and set the SSL_KEY and SSL_CERT properties.
   
    ```dotenv
    SSL_KEY=C:/<wherever-you-put-the-files>/<VHOST>.key
    SSL_CERT=C:/<wherever-you-put-the-files>/<VHOST>.crt
    SSL_CA=C:/<wherever-you-put-the-files>/rootSSL.pem
    ```
7. You'll need to register the `rootSSL.pem` file you created with your Operating System. You can find
   instructions on how to do that [here](https://reactpaths.com/how-to-get-https-working-in-localhost-development-environment-f17de34af046)
   in step 3 "*Trust the Certificate Authority CA on your local development machine*".

### No SSL Setup

If you don't want to use SSL locally, you can use these settings:

  * No SSL on localhost:
      ```dotenv
      VHOST=localhost
      VHOSTED=0
      HTTP_PORT=3002
      SSL_ENABLED=false
      ```
      Application would be accessed at http://localhost:3002/
  * No SSL on custom domain name:
      ```dotenv
      VHOST=saccharose.localhost
      VHOSTED=1
      HTTP_PORT=80
      SSL_ENABLED=false
      ```
      Application would be accessed at http://saccharose.localhost/
           
### Game Data Setup
       
You'll need to repeat this step after every new Genshin Impact version.

It's recommended you install `ts-node` globally with `npm install -g ts-node`

1.  **Obtain data folders for GI/HSR/ZZZ**
   
    * Obtain the GI Data folder and specify the location to it in the `GENSHIN_DATA_ROOT` property of `.env`
      * The Genshin Data folder should contain these folders: `ExcelBinOutput`, `Readable`, `Subtitle`, `TextMap`.
          * The `Readable` folder should contain sub-folders where each sub-folder name is `<LangCode>` for each language code.
          * The `Subtitle` folder should contain sub-folders where each sub-folder name is `<LangCode>` for each language code.
            Within each language code folder there should be SRT files with the file extension `.txt` or `.srt`
          * The `TextMap` folder should contain JSON files in the format of `TextMap<LangCode>.json` where `<LangCode>`
            is one of these: `'CHS', 'CHT', 'DE', 'EN', 'ES', 'FR', 'ID', 'IT', 'JP', 'KR', 'PT', 'RU', 'TH', 'TR', 'VI'`.
            For example `TextMapCHS.json`.
      * Also needs the `BinOutput` folder, but only needs these two subfolders:
        * The `BinOutput/Voice/Items` folder
        * The `BinOutput/_unknown_dir` folder from Dim's repo.

    * Obtain the HSR Data folder and specify the location to it in the `HSR_DATA_ROOT` property of `.env`
    * Obtain the ZZZ Data folder and specify the location to it in the `ZENLESS_DATA_ROOT` property of `.env`

2.  **Import files (normalize)**
    
    * Run with: `ts-node ./src/backend/importer/genshin/import_genshin_files.ts --normalize`
    * Run with: `ts-node ./src/backend/importer/hsr/import_hsr_files.ts --normalize`
    * Run with: `ts-node ./src/backend/importer/zenless/import_zenless_files.ts --normalize`

3.  **Import files (plaintext)**
    
    This will create a new folder called Plain at `{DATA_ROOT}/TextMap/Plain` and will fill
    this folder with files called `PlainTextMap<LangCode>_Hash.dat` and `PlainTextMap<LangCode>_Text.dat`
    for each language code.<br><br>
    
    * Run with: `ts-node ./src/backend/importer/genshin/import_genshin_files.ts --plaintext`.
    * Run with: `ts-node ./src/backend/importer/hsr/import_hsr_files.ts --plaintext`
    * Run with: `ts-node ./src/backend/importer/zenless/import_zenless_files.ts --plaintext`

4.  **Import files (voice) [genshin only]**
    
    This will create or overwrite a file called `VoiceItems.json` in
    your `GENSHIN_DATA_ROOT` folder.<br><br>
    
    * Run with: `ts-node ./src/backend/importer/genshin/import_genshin_files.ts --voice-items`.

5.  **Run import_db for each game**
   
    * Run with: `ts-node ./src/backend/importer/import_db.ts`.
        * Use the `--help` flag to see all the options
        * Use the `--game` flag with one of these values: `genshin`, `hsr`, `zenless`
        * You can use `--run-all` to first time you run it
        * Other options such as `--run-only` can regenerate specific tables on the existing database

6.  **Import files (index)**
    
    There are various other files to import after importing the database.
    
    * `ts-node ./src/backend/importer/genshin/import_genshin_files.ts --index`
    * `ts-node ./src/backend/importer/genshin/import_genshin_files.ts --gcg-skill`
    * `ts-node ./src/backend/importer/genshin/import_genshin_files.ts --voice-overs`
    
## Development

### Build and run

 * Run `npm run build:dev` then `npm run start` to build and run the application.
    * For production build, use `npm run build:prod` instead.
 * Note that `build:dev/prod` builds both the frontend and backend.
    * To build just the backend, run `npm run backend:build`
    * To build just the frontend, run `npm run webpack:dev` or `npm run webpack:prod`

### Live Reloading

While developing, you'll want to use live reloading. This will watch for file changes and
automatically reload  the code as you're developing. This is much faster than running
`npm run build:dev` and `npm run start` every time you make a code change.

 * Run `npm run ts-serve:dev` to start the backend with live-reloading.
 * Run `npm run webpack:dev-watch` to start the frontend with live-reloading.

It doesn't matter which order you run those two commands in.

### Structure

* `/dist` - build output for backend (gitignored folder)
* `/public/dist` - build output for frontend (gitignored folder)
* `/src/backend` - backend code
* `/src/frontend` - frontend code
* `/src/shared` - shared code used by both frontend and backend code. The frontend and backend folders should
  not share code between each other. Any shared code should go in `./src/shared`
  
## Genshin Images

You'll want to create the `public/images/genshin` folder and add the images matching these conditions.

All files in `Texture2D` starting with:
- `UI_`
- `Eff_`
- `Skill_`
- `MonsterSkill`

All files in `Sprite` starting with:
- `UI_Gcg_Dice`
- `UI_Gcg_Buff`
- `UI_Gcg_Tag`
- `UI_Buff`
- `UI_HomeWorldTabIcon`

Having these images isn't necessary for the application to run, but you'll have a bunch of broken images without them
in certain areas of the UI. If you don't know where to get these images, you can ask for them in the "Saccharose.wiki"
Discord editing forums post.

**Commands:**

- **Print Texture2D:** `find ./Texture2D/ -type f -regextype posix-extended -iregex '.*/(UI_|MonsterSkill|Eff_UI_Talent|.*Tutorial).*'`<br /><br />

- **Copy Texture2D:**  `find ./Texture2D/ -type f -regextype posix-extended -iregex '.*/(UI_|MonsterSkill|Eff_UI_Talent|.*Tutorial).*' -exec cp '{}' dist ';'`<br /><br />

- **Copy Sprite:** `find ./Sprite/ -type f -regextype posix-extended -iregex '.*/(UI_Buff|UI_Gcg_Dice|UI_Gcg_Buff|UI_Gcg_Tag|UI_HomeWorldTabIcon).*' -exec cp '{}' dist ';'`

- **Transfer:**: `rsync -avP ./dist hostname:/dest/path`
