from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate

# 🔗 Singleton instances
# These are the "Connectors" that bind your PostgreSQL and Session logic.
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

# 🛡️ Global Security Configuration
# If a developer tries to access a @login_required route, 
# they are redirected here to start the GitLab/GitHub handshake.
login_manager.login_view = "auth.login"
login_manager.login_message_category = "info"