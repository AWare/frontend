package views.support

import common.Edition
import common.dfp.AdSize.{leaderboardSize, responsiveSize}
import common.dfp._
import conf.switches.Switches._
import layout.{ColumnAndCards, ContentCard, FaciaContainer}
import model.pressed.PressedContent
import model.{ContentType, MetaData, Page, Tag}

object Commercial {

  def shouldShowAds(page: Page): Boolean = page match {
    case c: model.ContentPage if c.item.content.shouldHideAdverts => false
    case p: model.Page if p.metadata.section == "identity" => false
    case p: model.CommercialExpiryPage => false
    case _ => true
  }

  private def hasAdOfSize(slot: AdSlot,
                          size: AdSize,
                          metaData: MetaData,
                          edition: Edition,
                          sizesOverride: Seq[AdSize] = Nil): Boolean = {
    val sizes = if (sizesOverride.nonEmpty) sizesOverride else metaData.sizeOfTakeoverAdsInSlot(slot, edition)
    sizes contains size
  }

  object topAboveNavSlot {

    private def isBusinessFront(metaData: MetaData) = {
      metaData.id == "uk/business" || metaData.id == "us/business" || metaData.id == "au/business"
    }

    def adSizes(metaData: MetaData, edition: Edition): Map[String, Seq[String]] = {
      Map(
        "mobile" -> Seq("1,1", "88,70", "728,90"),
        "desktop" -> Seq("1,1", "88,70", "728,90", "940,230", "900,250", "970,250")
      )
    }

    // The sizesOverride parameter is for testing only.
    def cssClasses(metaData: MetaData, edition: Edition, sizesOverride: Seq[AdSize] = Nil): String = {
      val classes = Seq(
        "top-banner-ad-container",
        "top-banner-ad-container--desktop",
        "top-banner-ad-container--above-nav",
        "js-top-banner-above-nav")

      val sizeSpecificClass = {
        if (FixedTopAboveNavAdSlotSwitch.isSwitchedOn && isBusinessFront(metaData)) {
          if (hasAdOfSize(TopAboveNavSlot, leaderboardSize, metaData, edition, sizesOverride)) {
            "top-banner-ad-container--small"
          } else if (hasAdOfSize(TopAboveNavSlot, responsiveSize, metaData, edition, sizesOverride)) {
            "top-banner-ad-container--responsive"
          } else {
            "top-banner-ad-container--large"
          }
        } else {
          "top-banner-ad-container--reveal"
        }
      }

      (classes :+ sizeSpecificClass) mkString " "
    }
  }

  object topBelowNavSlot {

    def hasAd(metaData: MetaData, edition: Edition): Boolean = {
      metaData.hasAdInBelowTopNavSlot(edition)
    }
  }

  object topSlot {

    def hasResponsiveAd(metaData: MetaData, edition: Edition): Boolean = {
      hasAdOfSize(TopSlot, responsiveSize, metaData, edition)
    }
  }

  object container {

    def shouldRenderAsCommercialContainer(isPaidFront: Boolean, container: FaciaContainer): Boolean = {
      !isPaidFront && container.commercialOptions.isPaidContainer
    }

    private def contentCards(container: FaciaContainer): Seq[Option[ContentCard]] = {
      container.containerLayout map {
        _.slices flatMap {
          _.columns flatMap { case ColumnAndCards(_, cards) =>
            cards map {
              _.item match {
                case card: ContentCard => Some(card)
                case _ => None
              }
            }
          }
        }
      } getOrElse Nil
    }

    def numberOfContentCards(container: FaciaContainer): Int = contentCards(container).flatten.size

    def mkCardsWithBrandedContentDataAttributes(container: FaciaContainer, maxCardCount: Int):
    Seq[CardWithBrandedContentDataAttributes] = {
      val cardsAndContents: Seq[ContentCardAndItsContent] = {
        val allCardsAndContents = contentCards(container) zip container.collectionEssentials.items flatMap {
          case (None, _) => None
          case (Some(card), content) => Some(ContentCardAndItsContent(card, content))
        }
        allCardsAndContents take maxCardCount
      }
      cardsAndContents map (CardWithBrandedContentDataAttributes(_))
    }
  }
}

case class ContentCardAndItsContent(card: ContentCard, content: PressedContent)

case class BrandedContentDataAttributes(
  sponsor: Option[String],
  sponsorshipType: String,
  seriesId: Option[String],
  keywordId: Option[String]
)

object BrandedContentDataAttributes {

  def apply(content: PressedContent): Option[BrandedContentDataAttributes] = {

    def sponsoredTagPair(content: ContentType): Option[CapiTagAndDfpTag] = {
      DfpAgent.winningTagPair(
        capiTags = content.tags.tags,
        sectionId = Some(content.metadata.section),
        edition = None
      )
    }

    def mkFromSponsoredTagPair(tagProps: CapiTagAndDfpTag): BrandedContentDataAttributes = {
      val capiTag = tagProps.capiTag
      val dfpTag = tagProps.dfpTag

      def tagId(p: Tag => Boolean): Option[String] = if (p(capiTag)) Some(capiTag.id) else None

      BrandedContentDataAttributes(
        sponsor = dfpTag.lineItems.headOption flatMap (_.sponsor),
        sponsorshipType = dfpTag.paidForType.name,
        seriesId = tagId(_.isSeries),
        keywordId = tagId(_.isKeyword)
      )
    }

    content.properties.maybeContent flatMap (sponsoredTagPair(_) map mkFromSponsoredTagPair)
  }
}

case class CardWithBrandedContentDataAttributes(card: ContentCard, sponsorData: Option[BrandedContentDataAttributes])

object CardWithBrandedContentDataAttributes {

  def apply(cardAndContent: ContentCardAndItsContent): CardWithBrandedContentDataAttributes = {
    CardWithBrandedContentDataAttributes(cardAndContent.card, BrandedContentDataAttributes(cardAndContent.content))
  }
}
