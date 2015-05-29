define([
    'qwery',
    'bonzo',
    'bean',
    'fastdom',
    'common/utils/_',
    'common/utils/detect',
    'common/utils/config',
    'common/utils/mediator',
    'common/utils/template',

    'common/modules/identity/api',
    'common/views/svgs',
    'text!common/views/loyalty/save-for-later--signed-out.html',
    'text!common/views/loyalty/save-for-later--signed-in.html',
    'text!common/views/loyalty/save-for-later-front-link--signed-out.html',
    'text!common/views/loyalty/save-for-later-front-link--signed-in.html'
], function (
    qwery,
    bonzo,
    bean,
    fastdom,
    _,
    detect,
    config,
    mediator,
    template,
    identity,
    svgs,
    saveForLaterOutTmpl,
    saveForLaterInTmpl,

    signedOutLinkTmpl,
    signedInLinkTmpl

) {
    //This is because of some a/b test wierdness - '$' doesn't work
    var $ = function(selector, context) {
        return bonzo(qwery(selector, context));
    };

    function SaveForLater() {
        console.log("++ New");
        this.classes = {
             saveThisArticle: '.js-save-for-later',
             saveThisArticleButton: '.save-for-later__button',
             onwardContainer: '.js-onward',
             relatedContainer: '.js-related',
             itemMeta: '.js-item__meta',
             itemSaveLink: '.save-for-later-link',
             itemSaveLinkHeading: '.save-for-later-link__heading',
             profileDropdownLink: '.brand-bar__item--saved-for-later'
        };
        this.attributes = {
            containerItemShortUrl :'data-loyalty-short-url',
            containerItemDataId :'data-id'
        };
        this.templates = {
            signedIn: signedInLinkTmpl,
            signedOut: signedOutLinkTmpl,
            signedOutThisArticle: saveForLaterOutTmpl,
            signedInThisArticle: saveForLaterInTmpl
        };

        this.isContent = !/Network Front|Section/.test(config.page.contentType);
        console.log("+++ New " + this.isContent);
        this.userData = null;
        console.log("++ New 1" );
        this.savedArticlesUrl = config.page.idUrl + '/saved-for-later';
        console.log("++ New 2 ");
    }

    var bookmarkSvg = svgs('bookmark', ['i-left']);

    SaveForLater.prototype.init = function () {
        console.log("Init");
        var userLoggedIn = identity.isUserLoggedIn();
        if (userLoggedIn) {
            console.log("++ Signed In " + this.isContent);
            this.getSavedArticles();
        } else {
            if (this.isContent) {
                var url = config.page.idUrl + '/save-content?returnUrl=' + encodeURIComponent(document.location.href) +
                    '&shortUrl=' + config.page.shortUrl.replace('http://gu.com', '');
                this.renderSaveThisArticleLink(false, url, 'save');
            }
            this.renderLinksInContainers(false);
        }
    };



    SaveForLater.prototype.getElementsIndexedById = function (context) {
        var self = this,
            elements = qwery('[' + self.attributes['containerItemShortUrl'] + ']', context);

        return _.forEach(elements, function(el){
            return bonzo(el).attr(self.attributes['containerItemShortUrl'])
        });
    };

    SaveForLater.prototype.renderSaveThisArticleLink = function (deferToClick, url, state) {

        var self = this,
            $saver = bonzo(qwery('.js-save-for-later')[0]),
            //$saver = bonzo('.js-save-for-later'),
            templateName = self.templates[deferToClick ? 'signedInThisArticle' : 'signedOutThisArticle'];

        $saver.html(template(templateName, {
            url: url,
            icon: bookmarkSvg,
            state: state

        }));
    };

    SaveForLater.prototype.getSavedArticles = function () {
        var self = this,
            saveLinkHolder = qwery('.js-save-for-later')[0],
            shortUrl = config.page.shortUrl.replace('http://gu.com', ''),
            notFound  = {message:'Not found', description:'Resource not found'};

        console.log("+++ Get the Atricles");
        identity.getSavedArticles().then(
            function success(resp) {
                console.log("++ Rsp");
                if (resp.status === 'error') {
                    console.log("++ Error");

                    if (resp.errors[0].message === notFound.message && resp.errors[0].description === notFound.description) {
                        //Identity api needs a string in the format yyyy-mm-ddThh:mm:ss+hh:mm  otherwise it barfs
                        var date = new Date().toISOString().replace(/\.[0-9]+Z/, '+00:00');
                        self.userData = {version: date, articles:[]};
                    }
                } else {
                    console.log("++ Error");
                    self.userData = resp.savedArticles;
                }

                self.renderLinksInContainers(true);
                if ( self.isContent ) {
                    self.configureSaveThisArticle();
                }
                self.updateArticleCount();
            }
        );
    };

    SaveForLater.prototype.renderLinksInContainers = function(signedIn) {

        var self = this;
        console.log("++ Render container");

        if( !self.isContent ) {
            console.log("Render front pages");
            self.renderContainerLinks(signedIn, document.body)
        }

        mediator.on('modules:tonal:loaded', function() {
            console.log("+++ Got Tonal");
            self.renderContainerLinks(signedIn, self.classes['onwardContainer']);
        });

        mediator.on('modules:onward:loaded', function() {
            console.log("+++ Got Onwards");
            self.renderContainerLinks(signedIn, self.classes['onwardContainer']);
        });

        mediator.on('modules:related:loaded', function() {
            console.log("+++ Got related");
            self.renderContainerLinks(signedIn, self.classes['relatedContainer']);
        });
    };

    SaveForLater.prototype.configureSaveThisArticle = function () {

        console.log(" ++ Conf");
        console.log("Conf " + this.classes['saveThisArticle']);

        var saveLinkHolder = qwery(this.classes['saveThisArticle'])[0],
            shortUrl = config.page.shortUrl.replace('http://gu.com', '');

        if (this.hasUserSavedArticle(this.userData.articles, shortUrl)) {
            console.log("++ Saaved");
            this.renderSaveThisArticleLink(false, this.savedArticlesUrl, 'saved');
        } else {
            console.log("++ Not Saaved");
            this.renderSaveThisArticleLink(true, '', 'save');

            bean.one(saveLinkHolder, 'click', this.classes['saveThisArticleButton'],
                this.saveArticle.bind(this,
                    this.onSaveThisArticle.bind(this),
                    this.onSaveThisArticleError.bind(this),
                    this.userData,
                    config.page.pageId, shortUrl));
        }
    };

    // Configure the save for later links on a front or in a container
    SaveForLater.prototype.renderContainerLinks  = function(signedIn, context) {
        var self = this,
            elements = self.getElementsIndexedById(context);
        console.log("+++ Elements: " + elements.length);

        fastdom.read(function() {

            //TODO inline id
            _.forEach(elements, function (node) {
                console.log("Element: ");
                var $node = bonzo(node),
                    id = $node.attr(self.attributes['containerItemDataId']),
                    shortUrl = $node.attr(self.attributes['containerItemShortUrl']),
                    isSavedAlready = signedIn ? self.hasUserSavedArticle(self.userData.articles, shortUrl) : false,
                    saveUrl = config.page.idUrl + '/save-content?returnUrl=' + encodeURIComponent(document.location.href) +
                        '&shortUrl=' + shortUrl + '&articleId=' + id,
                    templateName = self.templates[signedIn ? "signedIn" : "signedOut"],
                    linkText = isSavedAlready ? "Saved" : "Save",
                    html,
                    meta,
                    $container;

                console.log("++ Vars set");
                html = template(templateName, {
                    link_text: linkText,
                    url: saveUrl
                });
                console.log("++ Template pop");


                meta = qwery(self.classes['itemMeta'], node);
                console.log("++ Meta");


                $container = meta.length ? bonzo(meta) : $node;

                console.log("++ Containter 2");

                fastdom.write(function () {
                    $container.append(html);
                    if (signedIn) {
                        var saveLink = $(self.classes['itemSaveLink'], node)[0];
                        if (isSavedAlready) {
                            self.createDeleteArticleHandler(saveLink,id, shortUrl);
                        } else {
                            self.createSaveArticleHandler(saveLink, id, shortUrl);
                        }
                    }
                });
                console.log("++ Written");
            });
        });
        console.log("++ Dom Done");
    };

        //--- Get articles
    // -------------------------Save Article
    SaveForLater.prototype.saveArticle = function (onArticleSaved, onArticleSavedError, userData, pageId, shortUrl) {
        console.log("++ Click");
        var self = this,
        date = new Date().toISOString().replace(/\.[0-9]+Z/, '+00:00'),
        newArticle = {id: pageId, shortUrl: shortUrl, date: date, read: false  };

        userData.articles.push(newArticle);

        identity.saveToArticles(userData).then(
            function(resp) {
                if(resp.status === 'error') {
                     console.log("Resp Failure");
                     onArticleSavedError();
                }
                else {
                    console.log("Resp success");
                    self.updateArticleCount();
                    onArticleSaved();
                }
            }
        );
    };

    SaveForLater.prototype.deleteArticle = function (onArticleDeleted, onArticleDeletedError, userData, pageId, shortUrl) {
        var self = this;

        userData.articles = _.filter(userData.articles, function (article) {
            return article.shortUrl !== shortUrl;
        });

        identity.saveToArticles(userData).then(
            function(resp) {
                if(resp.status === 'error') {
                     console.log("Delete Resp Failure");
                     onArticleDeletedError();
                }
                else {
                    console.log("Delete success");
                    self.updateArticleCount();
                    onArticleDeleted();
                }
            }
        );
    };

    //If this is an article Page, configure the save article link
    SaveForLater.prototype.onSaveThisArticle = function () {
        console.log("++++++++++++++ Sucees " );
        this.renderSaveThisArticleLink(false, this.savedArticlesUrl, 'saved');
    };

    SaveForLater.prototype.onSaveThisArticleError = function() {
        console.log("++++++++++++++ Error " );
        this.renderSaveThisArticleLink(true, '', 'save');
    };

    //--- Handle saving an article on a front of container
    SaveForLater.prototype.onSaveArticle = function (saveLink, id, shortUrl) {
        var self = this;
        console.log("On Save article: " + id );
        bonzo(qwery(self.classes['itemSaveLinkHeading'], saveLink)[0]).html('Saved');
        self.createDeleteArticleHandler(saveLink, id, shortUrl);
    };

    SaveForLater.prototype.onSaveArticleError = function (saveLink, id, shortUrl) {
        var self = this;
        console.log("On Save article error: " + id );
        bonzo(qwery(self.classes['itemSaveLinkHeading'], saveLink)[0]).html('Error Saving');
        self.createSaveArticleHandler(saveLink, id, shortUrl);
    };

    SaveForLater.prototype.onDeleteArticle = function (deleteLink, id, shortUrl) {
        var self = this;
        console.log("Un Save article: " + id );
        bonzo(qwery(self.classes['itemSaveLinkHeading'], deleteLink)[0]).html('Save');
        self.createDeleteArticleHandler(deleteLink, id, shortUrl);
    };

    SaveForLater.prototype.onDeleteArticleError = function (deleteLink, id, shortUrl) {
        var self = this;
        console.log("Error Un Save article: " + id );
        bonzo(qwery(self.classes['itemSaveLinkHeading'], deleteLink)[0]).html('Error Removing');
        self.createDeleteArticleHandler(deleteLink, id, shortUrl);
    };

    //--Create container link click handlers
    SaveForLater.prototype.createSaveArticleHandler = function(saveLink, id, shortUrl) {
        var self = this;

        console.log("Creating handla for " + id);
        bean.one(saveLink, 'click',
            self.saveArticle.bind(self,
                self.onSaveArticle.bind(self, saveLink, id, shortUrl),
                self.onSaveArticleError.bind(self, saveLink, id, shortUrl),
                self.userData,
                id,
                shortUrl
            )
        );
    };

    SaveForLater.prototype.createDeleteArticleHandler = function(deleteLink, id, shortUrl) {
        var self = this;

        console.log("Creating delete handla for " + id);
        bean.one(deleteLink, 'click',
            self.deleteArticle.bind(self,
                self.onDeleteArticle.bind(self, deleteLink, id, shortUrl),
                self.onDeleteArticleError.bind(self, deleteLink, id, shortUrl),
                self.userData,
                id,
                shortUrl
            )
        );
    };

    ///------------------------------Utils
    SaveForLater.prototype.hasUserSavedArticle = function (articles, shortUrl) {
        return _.some(articles, function (article) {
            return article.shortUrl.indexOf(shortUrl) > -1;
        });
    };

    SaveForLater.prototype.updateArticleCount = function() {
        var self = this,
            saveForLaterProfileLink = $(self.classes['profileDropdownLink']);

        saveForLaterProfileLink.html('Saved (' + self.userData.articles.length + ')')
    };

    return SaveForLater;
});
