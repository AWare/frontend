package controllers.commercial

import play.api.mvc._
import model.Cached
import common.{ExecutionContexts, JsonComponent}
import model.commercial.books.{BookFinder, BestsellersAgent}

object BookOffers extends Controller with ExecutionContexts {

  def bestsellers(format: String) = Action {
    implicit request =>
      BestsellersAgent.adsTargetedAt(segment) match {
        case Nil => NotFound
        case books if format == "json" =>
          Cached(60)(JsonComponent(views.html.books.bestsellers(books)))
        case books if format == "html" =>
          Cached(60)(Ok(views.html.books.bestsellers(books)))
      }
  }

  def singleBook(pageId: String, format: String) = Action.async {
    implicit request =>
      BookFinder.findByPageId(pageId) map {
        case Some(book) if format == "json" =>
          Cached(60)(JsonComponent(views.html.books.singleBook(book)))
        case Some(book) if format == "html" =>
          Cached(60)(Ok(views.html.books.singleBook(book)))
        case _ => NotFound
      }
  }
}
