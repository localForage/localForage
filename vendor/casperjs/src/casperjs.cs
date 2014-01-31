using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;

interface engine {
    string env_varname();
    string default_exec();
    string[] native_args();
}

class phantomjs : engine {
    public string env_varname() {
        return "PHANTOMJS_EXECUTABLE";
    }
    public string default_exec() {
        return "phantomjs";
    }
    public string[] native_args() {
        return new [] {
            "cookies-file",
            "config",
            "debug",
            "disk-cache",
            "ignore-ssl-errors",
            "load-images",
            "load-plugins",
            "local-storage-path",
            "local-storage-quota",
            "local-to-remote-url-access",
            "max-disk-cache-size",
            "output-encoding",
            "proxy",
            "proxy-auth",
            "proxy-type",
            "remote-debugger-port",
            "remote-debugger-autorun",
            "script-encoding",
            "ssl-protocol",
            "ssl-certificates-path",
            "web-security",
            "webdriver",
            "webdriver-logfile",
            "webdriver-loglevel",
            "webdriver-selenium-grid-hub",
            "wd",
            "w",
        };
    }
}

class slimerjs : engine {
    public string env_varname() {
        return "SLIMERJS_EXECUTABLE";
    }
    public string default_exec() {
        // use bat file on windows
        return (Path.DirectorySeparatorChar == '/') ? "slimerjs" : "slimerjs.bat";
    }
    public string[] native_args() {
        return new [] {
            "P",
            "jsconsole",
            "CreateProfile",
            "profile",
            //phantomjs options
            "cookies-file",
            "config",
            "debug",
            "disk-cache",
            "ignore-ssl-errors",
            "load-images",
            "load-plugins",
            "local-storage-path",
            "local-storage-quota",
            "local-to-remote-url-access",
            "max-disk-cache-size",
            "output-encoding",
            "proxy",
            "proxy-auth",
            "proxy-type",
            "remote-debugger-port",
            "remote-debugger-autorun",
            "script-encoding",
            "ssl-protocol",
            "ssl-certificates-path",
            "web-security",
            "webdriver",
            "webdriver-logfile",
            "webdriver-loglevel",
            "webdriver-selenium-grid-hub",
            "wd",
            "w",
        };
    }
}

class casperjs {
    static void Main(string[] args) {
        var SUPPORTED_ENGINES = new Dictionary<string, engine> {
            {"phantomjs", new phantomjs()},
            {"slimerjs", new slimerjs()}
        };

        string ENGINE = "phantomjs";
        var ENGINE_ARGS = new List<string>();
        string[] ENGINE_NATIVE_ARGS = {};
        string ENGINE_EXECUTABLE = "";

        string EXE_FILE = System.Reflection.Assembly.GetCallingAssembly().Location;
        var CASPER_ARGS = new List<string>();
        string CASPER_PATH = Path.GetFullPath(Path.Combine(Path.Combine(EXE_FILE, ".."), ".."));

        foreach(string arg in args) {
            if(arg.StartsWith("--engine")) {
                ENGINE = arg.Substring(9);
                break;
            }
        }

        if(SUPPORTED_ENGINES.ContainsKey(ENGINE)) {
            ENGINE_NATIVE_ARGS = SUPPORTED_ENGINES[ENGINE].native_args();
            ENGINE_EXECUTABLE = Environment.GetEnvironmentVariable(SUPPORTED_ENGINES[ENGINE].env_varname())
                    ?? SUPPORTED_ENGINES[ENGINE].default_exec();
        } else {
            Console.WriteLine("Bad engine name. Only phantomjs and slimerjs are supported");
            Environment.Exit(1);
        }

        foreach(string arg in args) {
            bool found = false;
            foreach(string native in ENGINE_NATIVE_ARGS) {
                if(arg.StartsWith("--" + native)) {
                    ENGINE_ARGS.Add(arg);
                    found = true;
                }
            }

            if(!found)
                if(!arg.StartsWith("--engine="))
                    CASPER_ARGS.Add(arg);
        }

        var ENGINE_EXEC = new List<string>(ENGINE_EXECUTABLE.Split(' '));
        var ENGINE_FILE = ENGINE_EXEC[0];
        ENGINE_EXEC.RemoveAt(0);

        var CASPER_COMMAND = new List<string>(ENGINE_EXEC);
        CASPER_COMMAND.AddRange(ENGINE_ARGS);
        CASPER_COMMAND.AddRange(new [] {
            Path.Combine(Path.Combine(CASPER_PATH, "bin"), "bootstrap.js"),
            "--casper-path=" + CASPER_PATH,
            "--cli"
        });
        CASPER_COMMAND.AddRange(CASPER_ARGS);

        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = ENGINE_FILE;
        psi.UseShellExecute = false;
        psi.RedirectStandardOutput = true;
        psi.Arguments = String.Join(" ", CASPER_COMMAND.ToArray());

        try {
            Process p = Process.Start(psi);
            while (!p.StandardOutput.EndOfStream) {
                string line = p.StandardOutput.ReadLine();
                Console.WriteLine(line);
            }
        } catch(Win32Exception e) {
            Console.WriteLine("Fatal: " + e.Message + "; did you install " + ENGINE + "?");
            Environment.Exit(1);
        }
    }
}
