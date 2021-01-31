// Constants
const user = "kishorv06";
const host = "github.io";
const githubCommitAPIEndpoint = "https://api.github.com/repos/" + user + "/" + user + "." + host + "/commits?per_page=1";
const terminal = $("#terminal");
const colorPalette = ["red", "yellow", "green", "blue", "cyan", "magenta", "white", "black"];

// Variables
var currentDir = `/home/${user}/`;
var commandHistory = [];
var currentHistoryPosition = null;
var files = [];
var lastCommitDate = "";
var config;

/*----------------------
    Helper functions
------------------------*/
function isMobileorTablet() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

/*------------------- 
    File functions
---------------------*/

// Expand and convert path to absolute reference
function getAbsolutePath(path) {
    path = path.replace("~/", "/home/" + user + "/");
    path = path.replace("../", currentDir.split("/").slice(0, -2).join("/") + "/");
    path = path.replace("./", currentDir);
    path = path.startsWith("/") ? path : currentDir + path;
    path = (getFileInfo(path).type == "" && !path.endsWith("/")) ? path + "/" : path;
    return path;
}

// Get basic info about a file from its path
function getFileInfo(path) {
    var fileName = path.split("/").slice(-1)[0];
    var fileExtension = "";
    if (fileName.indexOf(".") != -1)
        fileExtension = fileName.split(".").slice(-1)[0];
    return {
        name: fileName,
        type: fileExtension
    };
}

// Get a file or folder from path
function getFile(path) {
    path = getAbsolutePath(path);
    var dir = config.files;
    path.split("/").some((item) => {
        if (item != "") {
            if (dir[item]) {
                dir = dir[item];
            } else {
                dir = null;
                return true;
            }
        }
        return false;
    });
    if (dir) {
        var isDir = !(typeof (dir) == "string");
        var children = {};
        for (const [key, value] of Object.entries(dir)) {
            children[key] = (typeof (value) == "string") ? "file" : "dir";
        }
        var fileInfo = getFileInfo(path);
        return {
            name: fileInfo.name,
            type: fileInfo.type,
            path: path,
            isDir: isDir,
            children: children,
            content: (isDir) ? "" : dir
        };
    }
    return null;
}

// Find file by partial path
function getFilesFromPartialPath(path) {
    var parentFolder = path.split("/").slice(0, -1).join("/"),
        partialName = path.split("/").slice(-1)[0],
        isRelative = !path.startsWith("/") && parentFolder == "",
        fileObject = getFile(isRelative ? currentDir : parentFolder + "/"),
        isRegex = partialName.indexOf("*") != -1,
        regex = new RegExp(
            partialName
                .replace(".", "\\.")
                .replace("*", ".*")
        )
    if (fileObject && fileObject.isDir) {
        var possibleResults = [];
        for (const [key, value] of Object.entries(fileObject.children)) {
            if (
                (isRegex && key.match(regex)) || // If regex match
                key.startsWith(partialName) // If partial match
            ) {
                var fullName = value == "dir" ? key + "/" : key
                possibleResults.push(isRelative ? fullName : parentFolder + "/" + fullName);
            }
        }
        if (isRegex)
            return possibleResults;
        else if (possibleResults.length > 0)
            return possibleResults.slice(0, 1);
    }
    return [];
}

/*---------------------- 
    Output functions
------------------------*/

// Print HTML content line by line
function printHtml(html, onComplete) {
    if (!html || html == "") {
        if (onComplete)
            onComplete();
        return;
    }
    var lines = html.split("\n");
    _print(lines, true, onComplete);
}

// Print text content line by line
function printLine(text, onComplete) {
    if (!text || text == "") {
        if (onComplete)
            onComplete();
        return;
    }
    var lines = text.split("\n");
    _print(lines, false, onComplete);
}

// Internal print function used by printHTML and printLine
function _print(lines, is_html, onComplete) {
    lines.forEach((line, index) => {
        setTimeout(function () {
            terminal.append(is_html ? line : "<div class='line'>" + line + "</div>");
            if (index == lines.length - 1) {
                if (onComplete)
                    onComplete();
            }
            scrollToBottom();
        }, 50 * index);
    });
}

/*---------------------- 
    Terminal functions
------------------------*/

// Update command history
function updateHistory(command) {
    commandHistory.push(command);
    currentHistoryPosition = commandHistory.length;
    localStorage.setItem("history", commandHistory.join("\n"));
    if (gtag) {
        gtag('event', 'command_executed', { 'command': command });
    }
}

// Execute given command
function executeCommand(command) {
    $(".prompt").last().find(".cursor").remove();
    if (command == "") {
        showPrompt();
        return;
    }
    updateHistory(command);
    var commandAsArray = command.split(" ");
    var commandFunction = commands[commandAsArray[0]];
    if (commandFunction == undefined) {
        printLine("zsh: command not found: " + commandAsArray[0], showPrompt);
    } else {
        parameters = commandAsArray.slice(1);
        expandedParameters = [];
        for (let p of parameters.values()) {
            // Check is wildcard is present
            if (p.indexOf("*") > -1) {
                var results = getFilesFromPartialPath(p);
                if (results && results.length > 0) {
                    // We have some expanded results
                    expandedParameters = expandedParameters.concat(results);
                } else {
                    // Expansion failed. Let command handle the error
                    expandedParameters.push(p);
                }
            } else {
                // Not a wildcard expression. Add it as it is
                expandedParameters.push(p);
            }
        }
        var response = commandFunction(expandedParameters);
        if (response != undefined) {
            if (response != "")
                printLine(response, showPrompt);
            else
                showPrompt();
        }
    }
}

$(window).on("keydown", function (key) {
    var text = $(".prompt").last().find(".text");
    if (key.key.length > 1) {
        if (key.key == "Enter") {
            query = text.html().trim();
            executeCommand(query);
        } else if (key.key == "Backspace") {
            text.html(text.html().slice(0, -1));
        } else if (key.key == "ArrowUp") {
            currentHistoryPosition -= 1;
            if (currentHistoryPosition <= 0) {
                currentHistoryPosition = 0;
            }
            text.html(commandHistory[currentHistoryPosition]);
        } else if (key.key == "ArrowDown") {
            currentHistoryPosition += 1;
            if (currentHistoryPosition == commandHistory.length) {
                currentHistoryPosition -= 1;
            }
            text.html(commandHistory[currentHistoryPosition]);
        } else if (key.key == "Tab") {
            var commandAsArray = text.html().split(" ");
            if (commandAsArray.length == 1) {
                for (command in commands) {
                    if (command.startsWith(commandAsArray[0])) {
                        text.html(command);
                        break;
                    }
                }
            } else {
                var partialPath = commandAsArray[commandAsArray.length - 1];
                var results = getFilesFromPartialPath(partialPath);
                if (results && results.length > 0) {
                    commandAsArray = commandAsArray.slice(0, -1).concat(results);
                    text.html(commandAsArray.join(" "));
                }
            }
        }
    } else {
        var keyval = key.key;
        if (key.shiftKey) keyval = keyval.toUpperCase();
        text.html(text.html() + keyval);
    }
    key.preventDefault();
});

// Show prompt
function showPrompt() {
    var minimalWD = currentDir.replace("/home/" + user, "~")
    minimalWD = minimalWD.endsWith("/") ? minimalWD.slice(0, -1) : minimalWD;
    terminal.append(`<div class='prompt'>[<span class="red">` + user + `</span>@<span class="green">` + host + `</span><span class="white">:</span> <span class="blue">` + minimalWD + `</span>] $ <span class="text"></span><span class="cursor"></span></div>`);
    $(".title-text").html(user + "@" + host + " : " + minimalWD);
    scrollToBottom();
}

// Scroll page to bottom
function scrollToBottom() {
    $("#terminal").animate({
        scrollTop: $("#terminal")[0].scrollHeight
    }, 50);
}

/*------------------------------
    Initialization functions
--------------------------------*/

// Load last updated date from Git commit
function loadLastUpdated(callback) {
    $.getJSON(githubCommitAPIEndpoint, (data) => {
        // Get the last commit date from GitHub
        lastCommitDate = new Date(
            data[0]["commit"]["committer"]["date"]
        ).toLocaleDateString(
            'en-US',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        );
        callback();
    });
}

// Load YAML configuration
function loadConfig(callback) {
    $.get("config.yaml", (data) => {
        config = jsyaml.load(data);
        callback();
    });
}

// Handle document ready event
$(document).ready(() => {
    // Initialize highlight JS
    hljs.configure({
        classPrefix: "code-"
    });

    // Load history
    var historyFromStorage = localStorage.getItem('history');
    if (historyFromStorage) {
        commandHistory = historyFromStorage.split("\n");
        currentHistoryPosition = commandHistory.length;
    }

    $(".loading").addClass("done");
    $(".loading").addClass("p60");
    // Load config file
    loadConfig(() => {
        $(".loading").removeClass("p60").addClass("p80");
        loadLastUpdated(() => {

            $(".loading").removeClass("p80").addClass("p100");

            // Show neofetch
            window.setTimeout(() => {
                terminal.html("");
                if (isMobileorTablet()) {
                    // Show mobile warning for 5 seconds
                    printLine("zsh: Warning!! Mobile Device detected.\nPlease use a computer for the interactive experience...");

                    // Show neofetch
                    window.setTimeout(() => {
                        terminal.html("");
                        executeCommand("neofetch");
                    }, 5000);
                } else {
                    executeCommand("neofetch");
                }
            }, 1000);
        });
    });
});