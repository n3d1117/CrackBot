#!/usr/bin/env osascript -l JavaScript

/*
    NOTE: this is deprecated since iTunes 12.7 removed the option to download ipas
*/

/*
    This is a modified version of https://github.com/attheodo/cherrypick
    All credits go to him
*/

ObjC.import('stdlib')

var iTunesApp;
var iTunesAppWindow;
var appName;

function myPath() {
    var app = Application.currentApplication(); app.includeStandardAdditions = true
    return $(app.pathTo(this).toString()).stringByDeletingLastPathComponent.js
}

function run(args) {
    if (args.length < 1) {
        printHelp();
    } else {
        openiTunesWithURL(fixUrl(args[0]));
        getiTunesAppWindow();
        downloadApplication();
        monitorDownload();
    }
}

var printHelp = function() {
    console.log('Painless .ipa download from iTunes');
    console.log('\n\tUsage:');
    console.log('\t$ ipa_from_itunes.js <App URL on iTunes>');
};

/*
 * Convert url from https to itms
 *
 * @param {String} iTunesURL
 */
var fixUrl = function(url) {
    return url.replace('https:', 'itms:');
};

/*
 * Opens iTunes application and directs it to open app URL in Store
 *
 * @param {String} iTunesURL The iTunes URL to open in iTunes. MUST start with "itms://"
 */
var openiTunesWithURL = function(iTunesURL) {
    console.log('\x1b[36m%s\x1b[0m', '[JXA] Firing up iTunes with location: ' + iTunesURL);
    iTunesApp = Application('iTunes');
    iTunesApp.openLocation(iTunesURL);
};

/*
 * Gets the iTunes application window through the `System Events` framework.
 * We need this to mess with low level UI controls because most of them are not
 * directly accessible from what Automation/JXA exposes for iTunes app.
 */
var getiTunesAppWindow = function() {
    var system = Application('System Events');
    iTunesAppWindow = system.applicationProcesses['iTunes'].windows[0];
};

/*
 * Juicy part. This method keeps trying to find the "Download" button on the app's
 * page on iTunes. Every time it bumps the polling interval by one second cause we
 * don't want to be very aggressive.
 */
var downloadApplication = function() {

    var retries = 0;
    var maxRetries = 10;

    while(true) {
        try {
            var button = iTunesAppWindow.splitterGroups[0].groups[0].groups[0].scrollAreas[0].uiElements[0].groups[2].buttons[0]
            var controlDescrStrComponents = button.description().split(",");
            var fullAppName = controlDescrStrComponents[1].slice(1);
            console.log('\x1b[36m%s\x1b[0m', '[JXA] Found application: "' + fullAppName +'". Downloading...');
            appName = fullAppName.split(" ")[0]
            if (appName.charAt(appName.length-1) == ':') {
              appName = appName.slice(0, -1)
            }
            button.click();
            break;
        } catch(e) {
            delay(2);
            if(++retries === maxRetries) {
                console.log('\x1b[36m%s\x1b[0m', '[JXA][!] Cannot reach desirable state. Exiting...');
                iTunesApp.openLocation('itms://itunes.apple.com/');
                $.exit(-1);
            }
        }
    }
};

/*
 * Steps into ObjC lalaland and checks whether our app was downloaded. The app
 * download starts as a *.tmp file in "_/iTunes Media/Downloads". When the download
 * is finished, it's copied over to "_/iTunes Media/Mobile Applications". We Poll
 * that directory and when our file appears, we're done.
 *
 */
var monitorDownload = function() {

    var retries = 0;
    var maxRetries = 333;

    var isFileNotFound = true;
    var home = ObjC.unwrap(ObjC.unwrap($.NSProcessInfo.processInfo.environment).HOME);
    var fileMgr = $.NSFileManager.defaultManager;

    // Create directory if it doesn't exist
    var enc = myPath() + "/encrypted";
    if (!fileMgr.fileExistsAtPath(enc)) {
        fileMgr.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(enc, false, $(), $());
    }

    // Before monitoring, check if ipa already exists in encrypted path: if so, use it directly
    /*var lstFiles = ObjC.unwrap(fileMgr.contentsOfDirectoryAtPathError(myPath() + "/encrypted", null));
    if (lstFiles) {
        for(var i=0; i < lstFiles.length; i++) {
            var filename = ObjC.unwrap(lstFiles[i]);
            if (filename != '.DS_Store') && (filename.toLowerCase().indexOf(appName) > -1) {
                console.log('\x1b[36m%s\x1b[0m', '[JXA] File found at ./encrypted, using that instead...');
                text = $.NSString.alloc.initWithUTF8String(filename);
                text.writeToFileAtomically(myPath() + "/tmp.txt", true);
                quit();
            }
        }
    }*/

    // Start monitoring iTunes download folder
    var downloadsPath = home + '/Music/iTunes/Previous iTunes Libraries/iTunes Media/Mobile Applications';
    while(isFileNotFound) {
        var files = [];
        var lstFiles = ObjC.unwrap(fileMgr.contentsOfDirectoryAtPathError(downloadsPath, null));
        if (lstFiles) {
            for(var i=0; i < lstFiles.length; i++) {
                var filename = ObjC.unwrap(lstFiles[i]);

                // console.log('é'.indexOf('é') > -1) WHAT THE ACTUAL FUCK - fuck this shit i'm out

                //if (filename != '.DS_Store' && filename.toLowerCase().indexOf(appName.toLowerCase()) > -1) {
                if (filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) == 'ipa') {
                    isFileNotFound = false;

                    console.log('\x1b[32m%s\x1b[0m', '[JXA] ✔ Download complete (found "' + filename + '"). Moving to ./encrypted folder...');

                    delay(1);

                    text = $.NSString.alloc.initWithUTF8String(filename);
                    text.writeToFileAtomically(myPath() + "/tmp.txt", true);

                    Application("Finder").move(Path(downloadsPath + "/" + filename), {
                        to: Path(enc + "/"),
                        replacing: true
                    })
                }
            }
        }
        delay(3);
        // Timeout after 999s
        if(++retries === maxRetries) {
            console.log('\x1b[36m%s\x1b[0m', '[JXA][!] Timed out, probably a broken app name or too slow internet/too big ipa...');
            iTunesApp.openLocation('itms://itunes.apple.com/');
            $.exit(-1);
        }
    }

    quit();
};

var quit = function() {
    //iTunesApp.quit();
    iTunesApp.openLocation('itms://itunes.apple.com/'); // Let's change page instead of quitting
    $.exit(0);
};
