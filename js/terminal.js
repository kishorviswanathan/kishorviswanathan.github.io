var terminal = $("#terminal");
var commandHistory = [];
var currentHistoryPosition = null;
var user = "kishorv06";
var host = "github.io";
var currentDir = "/home/" + user + "/portfolio/";
var files = [];

var allCommands = {
    "cat": function (vars) {
        if (vars.length == 0)
            return "cat: No file specified.";

        var results = "";
        for (let f of vars.values()) {
            var file = f;
            if (!file.startsWith("/"))
                file = currentDir + file;

            if (!files.includes(file))
                return "cat: " + f + ": no such file or directory";

            var selector = file.split("/").flatMap((item) => {
                if (item)
                    return "#" + item.replace('.', '\\.');
                return [];
            }).join('>');

            results += $(".data > #files > " + selector).html();
        }

        printHtml(results, showPrompt);
        return;
    },
    "cd": function (vars) {
        var directory = vars.length == 1 ? vars[0] : "/home/" + user;
        if (!directory.startsWith("/"))
            if (directory.startsWith("../"))
                directory = currentDir.split("/").slice(0, -2).concat(directory.split("/").slice(1)).join("/")
            else
                directory = currentDir + directory;

        directory = getAbsolutePath(directory);
        if (files.indexOf(directory) == -1 || !directory.endsWith("/")) {
            return "cd: no such file or directory: " + directory;
        }
        currentDir = directory;
        return "";
    },
    "clear": function (vars) {
        terminal.empty();
        showPrompt();
        return;
    },
    "help": function (vars) {
        var response = "Available commands:\n";
        response += Object.keys(allCommands).join("\n");
        return response;
    },
    "history": function (vars) {
        var response = "";
        var len = commandHistory.length;
        var count = (len.toString().match(/\d/g) || []).length
        var i = 1;
        commandHistory.forEach(function (command) {
            response += (i++).toString().padStart(count, ' ') + "&nbsp;&nbsp;" + command + "\n";
        });
        return response;
    },
    "ls": function (vars) {
        var results = [];
        var directory = (vars.length == 1) ? vars[0] : currentDir;
        directory = getAbsolutePath(directory);
        files.forEach((item) => {
            if (item.startsWith(directory)) {
                var relativePath = item.replace(directory, "");
                if (relativePath.indexOf("/") == -1 || relativePath.indexOf("/") == relativePath.length - 1) {
                    results = results.concat(relativePath);
                }
            }
        });
        return results.join('\n');
    },
    "neofetch": function (vars) {
        printHtml(`
            <img class='dp' src='./images/dp.png' />
            <p class='green'>Information</p>
            <p>-----------------------</p>
            <p><span class='yellow'>Name:</span> Kishor V</p>
            <p><span class='yellow'>About:</span> Hacker, Coder and Web developer</p>
            <p><span class='yellow'>Email:</span> <a href='mailto:developer.kishor@gmail.com'>developer.kishor@gmail.com</a></p>
            <p><span class='yellow'>Skills:</span> Linux, Android, Python, Web Development</p>
            <p><span class='yellow'>Source Code:</span> <a href='https://gitlab.com/kishorv06/portfolio'>Gitlab</a></p>
            <p><span class='yellow'>Last Updated:</span> 16 July 2020</p>
            <div class='palette-block bg-red'></div>
            <div class='palette-block bg-yellow'></div>
            <div class='palette-block bg-green'></div>
            <div class='palette-block bg-blue'></div>
            <div class='palette-block bg-cyan'></div>
            <div class='palette-block bg-magenta'></div>
            <div class='palette-block bg-white'></div>
            <div class='palette-block bg-black'></div>
        `, showPrompt);
        return;
    },
    "ping": function (vars) {
        return "pong!!";
    },
    "pwd": function (vars) {
        return currentDir;
    },
    "sudo": function (vars) {
        return "'" + user + "' is not in the sudoers file.";
    },
    "which": function (vars) {
        if (vars.length == 0)
            return "";
        if (vars[0] in allCommands) {
            return "/bin/" + vars[0];
        }
        return vars[0] + " not found";
    },
    "whoami": function (vars) {
        return user;
    }
}

function getAbsolutePath(path) {
    path = path.replace("~/", "/home/" + user + "/");
    path = path.endsWith("/") ? path : path + "/";
    return path;
}

function scrollToBottom() {
    $("#terminal").animate({
        scrollTop: $("#terminal")[0].scrollHeight
    }, 50);
}

function printHtml(html, onComplete) {
    if (!html)
        onComplete();
    var lines = html.split("\n");
    print(lines, true, onComplete);
}

function printLine(text, onComplete) {
    if (!text)
        onComplete();
    var lines = text.split("\n");
    print(lines, false, onComplete);
}

function print(lines, is_html, onComplete) {
    lines.forEach((line, index) => {
        setTimeout(function () {
            terminal.append(is_html ? line : "<div class='line'>" + line.replace(' ', "&nbsp;") + "</div>");
            if (index == lines.length - 1) {
                onComplete();
            }
            scrollToBottom();
        }, 50 * index);
    });
}

function showPrompt() {
    var minimalWD = currentDir.replace("/home/" + user, "~")
    minimalWD = minimalWD.endsWith("/") ? minimalWD.slice(0, -1) : minimalWD;
    terminal.append(`<div class='prompt'>[<span class="red">` + user + `</span>@<span class="green">` + host + `</span><span class="white">:</span> <span class="blue">` + minimalWD + `</span>] $ <span class="text"></span><span class="cursor"></span></div>`);
    $(".title-text").html(user + "@" + host + " : " + minimalWD);
    scrollToBottom();
}

function executeCommand(command) {
    $(".prompt").last().find(".cursor").remove();
    if (command == "") {
        showPrompt();
        return;
    }
    commandHistory.push(command);
    currentHistoryPosition = commandHistory.length;
    var commandAsArray = command.split(" ");
    var commandFunction = allCommands[commandAsArray[0]];
    if (commandFunction == undefined) {
        printLine("zsh: command not found: " + commandAsArray[0], showPrompt);
    } else {
        parameters = commandAsArray.slice(1);
        expandedParameters = [];
        for (let p of parameters.values()) {
            if (p.indexOf("*") > -1) {
                query = p.replace('.', '\\.').replace('*', '.*');
                filtered_files = files.filter((f) => { return f.match(query) });
                $.merge(expandedParameters, filtered_files);
            } else {
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
            query = text.html().replace(/(?:&nbsp;){1,}/g, " ").trim();
            executeCommand(query);
        } else if (key.key == "Backspace") {
            var length = text.html().length;
            var end = (text.html().endsWith("&nbsp;")) ? text.html().lastIndexOf("&nbsp;") : -1;
            text.html(text.html().slice(0, end));
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
            var commandAsArray = text.html().replace(/(?:&nbsp;){1,}/g, " ").split(" ");
            if (commandAsArray.length == 1) {
                for (command in allCommands) {
                    if (command.startsWith(commandAsArray[0])) {
                        text.html(command);
                        break;
                    }
                }
            } else {
                filtered_files = files.filter((f) => { return f.startsWith(commandAsArray[commandAsArray.length - 1]) });
                if (filtered_files.length > 0) {
                    commandAsArray[commandAsArray.length - 1] = filtered_files[0];
                    text.html(commandAsArray.join("&nbsp;"));
                }
            }
        }
    } else {
        var keyval = key.key;
        if (key.shiftKey) keyval = keyval.toUpperCase();
        if (keyval == ' ')
            keyval = "&nbsp;"
        text.html(text.html() + keyval);
    }
    key.preventDefault();
});

function isMobileorTablet() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

function scanFiles(path) {
    if (!path)
        path = Array();
    var selector = ['.data', '#files'].concat(
        path.flatMap((item) => {
            if (item)
                return "#" + item;
            return [];
        }),
        ['div']
    ).join('>');

    $(selector).map(function () {
        var id = $(this).attr('id');
        if ($(this).children("div").length > 0) {
            // Is a directory
            files = files.concat(
                "/" + path.concat(id).join("/") + "/"
            );
            scanFiles(path.concat(id));
        } else {
            // Is a file
            files = files.concat(
                "/" + path.concat(id).join("/")
            );
        }
    });
}

$(document).ready(() => {
    $(".loading").addClass("done");
    scanFiles();
    window.setTimeout(() => {
        terminal.html("");
        if (isMobileorTablet()) {
            printLine("zsh: Warning!! Mobile Device detected.\nPlease use a computer for the interactive experience...");
            window.setTimeout(() => {
                terminal.html("");
                executeCommand("neofetch");
            }, 5000);
        } else {
            executeCommand("neofetch");
        }
    }, 2000);
});