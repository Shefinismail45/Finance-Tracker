import os
from app import create_app
from app.extensions import db
from app.models import User, Category

app = create_app()

def init_db():
    with app.app_context():
        db.create_all()
        
        # Ensure default user
        user = db.session.query(User).first()
        if not user:
            user = User(name="Alice", primary_currency="USD")
            db.session.add(user)
            db.session.commit()
            print("Created default user: Alice (ID: 1)")

        # Ensure default categories
        existing_categories = db.session.query(Category).count()
        if existing_categories == 0:
            default_categories = [
                # Expense categories
                Category(name="Housing & Rent", kind="expense", icon="home", user_id=None),
                Category(name="Groceries & Food", kind="expense", icon="shopping-cart", user_id=None),
                Category(name="Utilities & Bills", kind="expense", icon="zap", user_id=None),
                Category(name="Transportation", kind="expense", icon="car", user_id=None),
                Category(name="Dining & Entertainment", kind="expense", icon="coffee", user_id=None),
                Category(name="Healthcare & Medical", kind="expense", icon="activity", user_id=None),
                Category(name="Shopping & Personal", kind="expense", icon="shopping-bag", user_id=None),
                Category(name="Education & Learning", kind="expense", icon="book-open", user_id=None),
                Category(name="Travel & Vacation", kind="expense", icon="plane", user_id=None),
                Category(name="Other Expense", kind="expense", icon="more-horizontal", user_id=None),
                # Income categories
                Category(name="Salary & Wages", kind="income", icon="briefcase", user_id=None),
                Category(name="Freelance & Contracting", kind="income", icon="laptop", user_id=None),
                Category(name="Investments & Dividends", kind="income", icon="trending-up", user_id=None),
                Category(name="Rental Income", kind="income", icon="key", user_id=None),
                Category(name="Gifts & Grants", kind="income", icon="gift", user_id=None),
                Category(name="Other Income", kind="income", icon="dollar-sign", user_id=None),
            ]
            db.session.add_all(default_categories)
            db.session.commit()
            print(f"Seeded {len(default_categories)} default categories.")

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting backend on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=True, use_reloader=False)
