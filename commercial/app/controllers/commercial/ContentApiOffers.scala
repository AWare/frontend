package controllers.commercial

import common.ExecutionContexts
import model.commercial.Lookup
import model.{Cached, NoCache}
import performance.MemcachedAction
import play.api.mvc._

import scala.concurrent.Future

object ContentApiOffers extends Controller with ExecutionContexts {

  private def renderItems(format: Format, isMulti: Boolean) = MemcachedAction { implicit request =>
    val optKeyword = request.queryString get "k" map (_.head)

    val optLogo = request.queryString get "l" map (_.head)

    val optCapiTitle = request.queryString get "ct" map (_.head)

    val optCapiLink = request.queryString get "cl" map (_.head)

    val optCapiAbout = request.queryString get "cal" map (_.head)

    val futureLatestByKeyword = optKeyword.map { keyword =>
      Lookup.latestContentByKeyword(keyword, 4)
    }.getOrElse(Future.successful(Nil))

    val futureContents = for {
      specific <- Lookup.contentByShortUrls(specificIds)
      latestByKeyword <- futureLatestByKeyword
    } yield (specific ++ latestByKeyword).distinct take 4

    futureContents map {
      case Nil => NoCache(format.nilResult)
      case contents => Cached(componentMaxAge) {
        if (isMulti) {
          format.result(views.html.contentapi.items(contents, optLogo, optCapiTitle, optCapiLink, optCapiAbout))
        } else {
          format.result(views.html.contentapi.item(contents.head, optLogo, optCapiTitle, optCapiLink, optCapiAbout))
        }
      }
    }
  }

  def itemsHtml = renderItems(htmlFormat, true)
  def itemsJson = renderItems(jsonFormat, true)

  def itemHtml = renderItems(htmlFormat, false)
  def itemJson = renderItems(jsonFormat, false)
}
