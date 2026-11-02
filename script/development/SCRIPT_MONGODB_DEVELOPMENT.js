var cd = require('child_process');
var str = '';
var spawn = require('child_process').spawn,
    stdout = '',
    child = spawn('cmd.exe', ['\K'], {
        cwd: 'C:\\Program Files\\MongoDB\\Server\\7.0\\bin'
    });
var n = 1;
child.stdout.on('data', function (chunk) {
    str += chunk;
    if (n == 1) {
        child.stdin.write('mongosh --port 30000\n');
        n++;
    } else if (n == 2) {
        config = {
            _id: 'vAUTO',
            members: [{
                _id: 0,
                host: 'localhost:30000',
                priority: 1
            }]
        };
        child.stdin.write(`rs.initiate(${JSON.stringify(config)})\n`);
        child.stdin.write('rs.remove("localhost:40000", {force: true})\n', (e, d) => {
           child.stdin.write('rs.remove("localhost:50000", {force: true})\n');
        });
        n++;
    } else if (n == 3) {
        n++;
    } else if (n == 4) {
        n++;
    } else if (n == 5) {
        child.stdin.write('rs.status()\n');
        n++;
    } else if (n == 6) {
        process.exit();
    }

});
child.stderr.on('data', function (chunk) {
    str += chunk;

});
child.stdout.on('end', function (chunk) {
    res.end(str);
});
