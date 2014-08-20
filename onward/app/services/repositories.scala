package services

import common.Edition
import model.{Trail, Content}
import scala.concurrent.Future
import conf.{InlineRelatedContentSwitch, LiveContentApi}
import feed.MostReadAgent
import conf.Switches.RelatedContentSwitch

trait Related extends ConciergeRepository {
  def related(edition: Edition, path: String): Future[Seq[Trail]] = {

    if (RelatedContentSwitch.isSwitchedOff) {
      Future.successful(Nil)
    } else {

      val response = LiveContentApi.item(path, edition)
        .showRelated(true)
        .response

      val trails = response.map { response =>
        response.relatedContent map {
          Content(_)
        }
      }

      trails recoverApi404With Nil
    }
  }

  def getPopularInTag(edition: Edition, tag: String): Future[Seq[Trail]] = {

    val response = LiveContentApi.search(edition)
      .tag(tag)
      .pageSize(50)
      .response

    val trails: Future[Seq[Content]] = response.map { response =>
      response.results.map(Content(_)).sortBy(content => - MostReadAgent.getViewCount(content.id).getOrElse(0)).take(10)
    }

    trails
  }

}