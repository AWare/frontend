package model

import com.gu.facia.api.models.FaciaContent
import implicits.FaciaContentImplicits._

object EndSlateComponents {
  def fromContent(content: Content) = EndSlateComponents(
    content.series collectFirst { case Tag(apiTag, _) => apiTag.id },
    content.section,
    content.shortUrl
  )

  def fromFaciaContent(faciaContent: FaciaContent) = EndSlateComponents(
    faciaContent.series map ( Tag.apply(_) ) collectFirst { case Tag(apiTag, _) => apiTag.id },
    faciaContent.section,
    faciaContent.shortUrl
  )
}

case class EndSlateComponents(
  seriesId: Option[String],
  sectionId: String,
  shortUrl: String
) {
  def toUriPath = {
    val url = seriesId.fold(s"/video/end-slate/section/$sectionId")(id => s"/video/end-slate/series/$id")
    s"$url.json?shortUrl=$shortUrl"
  }
}
