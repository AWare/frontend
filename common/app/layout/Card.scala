package layout

import model.Trail
import views.support.CutOut

sealed trait Breakpoint

case object Mobile extends Breakpoint
case object Desktop extends Breakpoint

case class Card(
  index: Int,
  item: Trail,
  hideUpTo: Option[Breakpoint],
  cutOut: Option[CutOut]
) {
  def cssClasses = hideUpTo match {
    case Some(Mobile) => "fc-show-more--hide-on-mobile js-hide-on-mobile"
    case Some(Desktop) => "fc-show-more--hide js-hide"
    case _ => ""
  }

  def visibilityDataAttribute = hideUpTo match {
    case Some(Mobile) => "desktop"
    case Some(Desktop) => "hidden"
    case _ => "all"
  }
}
