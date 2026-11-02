
var log = require('../utils/logs');
const {Builder, By, Key, until} = require('selenium-webdriver');
/* Search */
module.exports.search = async (req, res, next) => {
    var topicName = req.body.topicName;
    var logs = []
    var url = 'http://' + req.body.url
    var searchPharse = req.body.searchPharse;
    var driverName = req.body.driverName;
    await log('Openning Chrome Driver using selenium',topicName, logs);
    try {
        // require('chromedriver');
        let driver = await new Builder().forBrowser(driverName).build();
        await log('opening URL ' + url, topicName, logs);
        await driver.get(url);
        await log('Entering the Search pharse:' + searchPharse, topicName, logs);
        await driver.findElement(By.name('q')).sendKeys(searchPharse, Key.RETURN);
        await log('Opening the Webpage from search results', topicName, logs);
        await driver.findElement(By.xpath('//*[@id="rso"]/div[1]/div/div/div/div[1]/a')).click()
        await log('Success in opening the Website', topicName, logs)
        res.send(JSON.stringify({
            RESULT: "0",
            logInfo: "Passed",
            FailureReason: "NA",
            log: logs
        }))
        await driver.quit();
    } catch (error) {
        await log(`Exception in API: ${error.message}`, topicName, logs);
        res.send(JSON.stringify({
        RESULT: "1",
        FailureReason: `Exception in API: ${error.message}`,
        log: logs
        }));
        //await driver.quit();
    }
}
/* Open */
module.exports.open = async (req, res, next) => {
    var topicName = req.body.topicName;
    var logs = []
    var url = 'http://' + req.body.url
    var searchPharse = req.body.searchPharse;
    var driverName = req.body.driverName;
    await log('Openning Chrome Driver using selenium',topicName, logs);

    try {
        // require('chromedriver');
        let driver = await new Builder().forBrowser(driverName).build();
        await log('opening URL ' + url, topicName, logs);
        await driver.get(url);
        await log('Validating the Website Title', topicName, logs)
        var title = await driver.getTitle();
        await log('Success in opening the Website', topicName, logs);
        await log('Validating the Website Title', topicName, logs);
        if(title === 'Google'){
            res.send(JSON.stringify({
                RESULT: "0",
                // returnValue: value,
                logInfo: "Passed",
                FailureReason: "NA",
                log: logs
            }))
        }else {
            res.send(JSON.stringify({
                RESULT: "1",
                FailureReason: `Website Title Validation Failed`,
                log: logs
                }));
        }


        await driver.quit();
    } catch (error) {

        await log(`Exception in API: ${error.message}`, topicName, logs)
        res.send(JSON.stringify({
        RESULT: "1",
        FailureReason: `Exception in API: ${error.message}`,
        log: logs
        }));
        //await driver.quit();
    }
}

