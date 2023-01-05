# Saccharose.wiki

## Prerequisites

* Install **Node.JS**
    * On Windows, you can install it from https://nodejs.org/en/download/ (LTS version) or you can use a package
      manager like Chocolatey or winget. You can also use [NVM](https://github.com/coreybutler/nvm-windows) if you
      want to be able to easily switch between different Node.JS versions.
    * On Linux, install it from your distro's package manager (e.g. `sudo apt-get install nodejs npm` on Debian/Ubuntu)
    * It's recommended that you install **ts-node** globally (`npm install -g ts-node`). You can use ts-node to run
      TS files directly without needing to transpile it to JS.
* Install **git** and **bash**
    * On Windows, you can install [Git Bash](https://git-scm.com/downloads) which will give you git, bash, and various
      Linux/Unix command-line utilities like grep, find, wget, etc.
    * On Windows, it's recommended that you use Git Bash as your shell rather than PowerShell or CMD.
    * On Windows, you can run the "Git Bash" app directly to start the terminal. But for a nicer terminal interface
      you can install [Windows Terminal](https://aka.ms/terminal) and add Git Bash to the Windows Terminal settings.
    * On Linux/Unix, you should already have bash and only need to install git. The command for this will differ
      depending on your distro (e.g. `sudo apt-get install git` on Debian/Ubuntu)

## Setup

1. Clone the repo from GitHub (`git clone git@github.com:kwwxis/Saccharose.git`)
2. Run `npm install` in the repo
3. Copy `.env.example` to new file `.env` and configure it according to the comments.
    1. **shell setup**
       
        This application requires the `grep` command to run.
        So you must specify a `SHELL_PATH` and `SHELL_EXEC` in the `.env` file.

        If you're on Linux/Unix, you should already have Bash. But on Windows,
        it's recommended that you install [Git Bash](https://git-scm.com/downloads).
    
        After installing Git Bash, you can configure the follow:
        ```dotenv
        SHELL_PATH='C:/Program Files/Git/usr/bin'
        SHELL_EXEC='C:/Program Files/Git/usr/bin/bash.exe'
        ```
        Or on Linux:
        ```dotenv
        SHELL_PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
        SHELL_EXEC=/bin/bash
        ```
    2. **SSL setup**
       
        You can run this project locally without SSL, but it's recommended that you set up SSL. You can do this by
        creating a self-signed SSL certificate:
       
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
           
    3. **Genshin Data Setup**
       
        You'll need to repeat this step after every new Genshin Impact version.
        The `import_run` step takes several hours, so if you're lazy you can just ask kwwxis or someone in the wiki
        discord to zip up their folder and send it to you.
       
        1. **Obtain Genshin Data folder**
           
           * Obtain the Genshin Data folder and specify the location to it in the `GENSHIN_DATA_ROOT` property of `.env`
    
           * The Genshin Data folder should contain these folders: `ExcelBinOutput`, `Readable`, `Subtitle`, `TextMap`.
                
                * TextMap folder should contain JSON files in the format of `TextMap<LangCode>.json` where `<LangCode>`
                  is one of these: `'CHS', 'CHT', 'DE', 'EN', 'ES', 'FR', 'ID', 'IT', 'JP', 'KR', 'PT', 'RU', 'TH', 'TR', 'VI'`.
                  For example `TextMapCHS.json`.
                * The `Readable` folder should contain sub-folders where each sub-folder name is `<LangCode>` for each language code.
                * The `Subtitle` folder should contain sub-folders where each sub-folder name is `<LangCode>` for each language code.
                  Within each language code folder there should be SRT files with the file extension ".txt" or ".srt"
    
           * And also the `BinOutput/Voice/Items` folder. None of the other folders in BinOutput are needed.
          
           * If you don't know where to get this data, you can probably find some people on the wiki discord
             to help you.
    
        2. **Run import_run**
           
           * This will take around 4 hours and will create a new file called `genshin_data.db` in your
             `GENSHIN_DATA_ROOT` folder. This file is a sqlite database.
           
           * You can start it by running `ts-node ./src/backend/scripts/importer/import_run.ts`.
           
           * Or you can do `npm run build:dev` and then `node ./dist/backend/scripts/importer/import_run.ts`.
           
        3. **Run import_voice**
           
           * This will take a few seconds and will create a new file called `voiceItemsNormalized.json` in
             your `GENSHIN_DATA_ROOT` folder.

           * You can start it by running `ts-node ./src/backend/scripts/importer/import_voice.ts`.
 3. Done!
    
## Development

### Build and run

 * Run `npm run build:dev` then `npm run start` to build and run the application.
    * For production build, use `npm run build:prod` instead.
 * Note that `build:dev/prod` builds both the frontend and backend.
    * To build just the backend, run `npm run backend:build`
    * To build just the frontend, run `npm run webpack:dev` or `npm run webpack:prod`

### Live Reloading

While developing, you'll want to use live reloading. This will watch for file changes and
automatically reload  the code as you're developing. This is much, much faster than running
`npm run build:dev` and `npm run start` every time you make a code change.

 * Run `npm run ts-serve:dev` to start the backend with live-reloading.
 * Run `npm run webpack:dev-watch` to start the frontend with live-reloading.

It doesn't matter which order you run those two commands in.

You can also just run one of them if you want. For example, if you only want to have live-reloading for the frontend
you can run `npm run backend:build` and `npm run webpack:dev-watch`

### The "TEXTMAP_LANG_CODES" property

Loading all the text maps can take a while. In your `.env` file, you can set `TEXTMAP_LANG_CODES` to a
comma-separated list of language codes you want to load the text maps for.

List of valid language codes are found in [./src/shared/general-types.ts](src/shared/types/general-types.ts)

For example:
```dotenv
TEXTMAP_LANG_CODES=EN
```

To load all text maps, set the property to empty string or remove it completely:
```dotenv
TEXTMAP_LANG_CODES=
```

The caveat with setting `TEXTMAP_LANG_CODES` is that the OL generator tool won't be fully functional. 
But if you're not working on stuff that needs  multiple text maps, then this can help make the reloads
faster when running `npm run ts-serve:dev`

### Structure

* `/dist` - build output for backend (gitignored folder)
* `/public/dist` - build output for frontend (gitignored folder)
* `/src/backend` - backend code
* `/src/frontend` - backend code
* `/src/shared` - shared code used by both frontend and backend code. The frontend and backend folders should
  not share code between each other. Any shared code should go in `./src/shared`
  
## Genshin Images

You'll want to create the `public/images/genshin` folder and add the follow images to it from Texture2D:

 - All images starting with `UI_AvatarIcon`
 - All images starting with `UI_EquipIcon`
 - All images starting with `UI_FlycloakIcon`
 - All images starting with `UI_ItemIcon`
 - All images starting with `UI_RelicIcon`