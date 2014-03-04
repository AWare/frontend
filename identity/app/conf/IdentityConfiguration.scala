package conf

import common.GuardianConfiguration
import com.gu.email.exacttarget.ExactTargetFactory
import java.net.URI
import utils.SafeLogging

class IdentityConfiguration extends GuardianConfiguration("frontend", webappConfDirectory = "env") with SafeLogging {

  object exacttarget {
    lazy val factory = for {
      accountName <- configuration.getStringProperty("exacttarget.accountname")
      password <- configuration.getStringProperty("exacttarget.password")
      endpointUrl <- configuration.getStringProperty("exacttarget.endpoint")
    } yield {
      logger.info(s"Found configuration for ExactTarget with endpoint $endpointUrl")
      new ExactTargetFactory(accountName, password, new URI(endpointUrl))
    }
  }

}
