const { fail } = require("assert");
const tools = require('./utils/tools');

module.exports = {
    serverport: 8081,       // HTTPS port — UI to Node API calls
    httpPort: 8080,         // HTTP port — API plugin calls (vauto-api, test-case)
    httpsPort: 8081,        // HTTPS port — normal UI calls
    BACKEND_URL: "10.85.249.130",
    BACKEND_PORT: "8081",
    JWTsecret: "v@ut0@ut#entic@ted",
    EMAIL_SERVER: "10.85.249.130:8080",
    LIVE_LOG_ENDPOINT: "http://127.0.0.1:4000/execution/live-logs",
    LOG_PATH: "",
    JIRA_URL: "http://localhost:8080",
    JIRA_USERNAME: "sathyamoorthy.p",
    JIRA_PASSWORD: "sathya",
    serverIP: "127.0.0.1",
    WITBE_URL: "https://ziggoinhome.cloud.witbe.net/api/v1/sessions/?force=1",
    WITBE_USERNAME: "api-call-request@witbe.net",
    WITBE_PASSWORD: "api-call-request",
    ADMIN_EMAIL: 'sysadmin@infosys.com',
    ENABLE_SSO: false,// for Ziggo make it true
    XRAY_ENABLE: true,// for Ziggo make it true,
    PROXY_STATUS: false, //for production make this thing true
    firmwareName : "Firmware Version", // for ziggo use  Firmware Version
    PROXY_URL: 'http://rncc-proxy-min.mgslb.vf.rogers.com:80/',
    XRAY_DOMAIN:"https://id.atlassian.com",
    XRAY_DOMAIN_API:"https://reqcentral.com",
    //XRAY_STEP_1_URL: "",
    //XRAY_STEP_2_URL: "",
    //XRAY_STEP_3_URL: "",
    //XRAY_STEP_5_URL: "",
    //XRAY_CREATE_STEP_1_URL: "",
    //XRAY_CREATE_STEP_2_URL: "",
    //XRAY_CREATE_STEP_3_URL: "",
    //XRAY_CREATE_STEP_4_URL: "",
    XRAY_CREATE_STEP_5_URL: "https://xray.cloud.getxray.app/api/internal/issuelinks/testexec/",
    JIRA_TESTEXECUTION_ID: "14403",
    DATA_PATH:"./object_files",
    SNMP_TIMEOUT:"720m",
    SNMP_INTERVEL:"5m",
    SNMP_START: " http://localhost:3002/polling/snmp/start",
    SNMP_STOP: "http://localhost:3002/polling/snmp/stop",
    DEVICE_DEFINED_MODE : ['ipv4'],
    API_TIMEOUT: 1800000,
    telementory_url: 'http://127.0.0.1:5001',
    TOKEN_EXPIRES_IN:"24h",
    MOBILE: "mobile",
    ANDROID: "Android",
    IOS: "iOS",
    cookieOrigin:'https://172.30.115.83',
    urllibURL:`http://127.0.0.1:4000/execution/live-logs`,
    XGSPON: "XGSPON",
    // Regression logs are written directly to this path instead of LOG_PATH.
    // Since 172.30.27.68 is a DIFFERENT server, mount it via NFS first (run once on this server):
    //   sudo mkdir -p /mnt/VMLogs
    //   sudo mount -t nfs 172.30.27.68:/home/VMLogs /mnt/VMLogs
    // For auto-mount on reboot, add this line to /etc/fstab:
    //   172.30.27.68:/home/VMLogs  /mnt/VMLogs  nfs  defaults  0  0
    // Leave empty ("") to write logs to LOG_PATH on this local server.
    // LOG_COPY_DESTINATION: "/mnt/VMLogs/"
    LOG_COPY_DESTINATION: ""
};

require("dns").lookup(require("os").hostname(), function (err, add, fam) {
    module.exports.serverIP = add;
    module.exports.LocalhostPath = "localhost";
    module.exports.LIVE_LOG_ENDPOINT = `http://${add}:${module.exports.serverport}/execution/live-logs`;
});

if (require("os").platform() === "win32") {
    module.exports.LOG_PATH = "C:/INTA/logs/"; // For ziggo iCAT
    module.exports.FILE_PATH = "/uploadFile/";
} else {
    module.exports.LOG_PATH = "/data/INTA/logs/"; //  // For ziggo iCAT
    module.exports.FILE_PATH = "/uploadFile/";
}
let databaseNaming = "INTA";
const userName = 'U2FsdGVkX18GWbFJJzTXkYkKvvKhgq3puzlN6ryeaxo=';
const password = 'U2FsdGVkX1894R1l3yBauf/Cb5d9YqTa+oQQLV8X1fI=';

// Export initialization promise so other modules can wait for config to be ready
// module.exports.initPromise = (async () => {
//     const decrpytedUserName = await tools.decryptPassword(userName);
//     const decrpytedPwd = await tools.decryptPassword(password);
    
//     if (process.env.NODE_ENV === "production") {
//         console.log("production>>>", process.env.NODE_ENV);
//         module.exports.database =
//             'mongodb://' + decrpytedUserName + ':' + decrpytedPwd + '@127.0.0.1:30000,127.0.0.1:40000,127.0.0.1:50000/' +
//             databaseNaming + "?authSource=admin";
//     } else {
//         console.log("development>>>", process.env.NODE_ENV);
//         module.exports.database = 'mongodb://' + decrpytedUserName + ':' + decrpytedPwd + '@127.0.0.1:30000/' + databaseNaming + "?authSource=admin";
//     }
//     module.exports.databaseName = databaseNaming;
// })();
if (process.env.NODE_ENV === "development") {
    module.exports.database = "mongodb://127.0.0.1:30000/" + databaseNaming;
    module.exports.databaseName = databaseNaming;
   
} else {
    module.exports.database =
        "mongodb://127.0.0.1:30000,127.0.0.1:40000,127.0.0.1:50000/" +
        databaseNaming;
    module.exports.databaseName = databaseNaming;
}