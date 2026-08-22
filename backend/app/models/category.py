from app.extensions import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    kind = db.Column(db.String(10), nullable=False, default="expense")  # 'income' or 'expense'
    name = db.Column(db.String(50), nullable=False)
    icon = db.Column(db.String(50), nullable=True)

    expenses = db.relationship("Expense", backref="category", lazy=True)

    __table_args__ = (
        db.UniqueConstraint("user_id", "kind", "name", name="uq_user_kind_category_name"),
    )

    @property
    def is_system_default(self):
        return self.user_id is None

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "kind": self.kind,
            "name": self.name,
            "icon": self.icon,
            "is_system_default": self.is_system_default
        }
