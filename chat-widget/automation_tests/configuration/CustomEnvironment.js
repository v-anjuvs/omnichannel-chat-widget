const PlaywrightEnvironment = require('jest-playwright-preset/lib/PlaywrightEnvironment')
    .default
const fs = require('fs');
class CustomEnvironment extends PlaywrightEnvironment {

    async handleTestEvent(event) {
        if (event.name === 'test_done' && event.test.errors.length > 0) {
            try {
                const parentName = event.test.parent.name.replace(/\W/g, '_');
                const specName = event.test.name.replace(/\W/g, '_');
                const contexts = this.global.browser.contexts();
                for (let [contextIndex, currentContext] of contexts.entries()) {
                    const contextPages = currentContext.pages();
                    for (let [pageIndex, currentPage] of contextPages.entries()) {
                        if (currentPage) {
                            try {
                                await currentPage.screenshot({
                                    path: `screenshots/${parentName}-${specName}_context${contextIndex}_page${pageIndex}_${new Date().getUTCHours()}-${new Date().getUTCMinutes()}.png`,
                                    fullPage: true,
                                    type: "png",
                                });
                                await currentPage.close();
                            } catch (e) {
                                console.log(`screenshot failed test: ${specName}_page${index} \n ${e}`);
                            }
                        }
                    }
                }
            } catch (e) {


            }
        }
    }
}

module.exports = CustomEnvironment