// Curated motivational & practical financial quotes
export const FINANCIAL_QUOTES = [
  {
    quote: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
    tag: "Savings"
  },
  {
    quote: "The goal isn't more money. The goal is living life on your terms.",
    author: "Chris Brogan",
    tag: "Mindset"
  },
  {
    quote: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin",
    tag: "Budgeting"
  },
  {
    quote: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    author: "Dave Ramsey",
    tag: "Debt & Freedom"
  },
  {
    quote: "Spending money to show people how much money you have is the fastest way to have less money.",
    author: "Morgan Housel",
    tag: "Wealth"
  },
  {
    quote: "Every dollar you save is a step closer to financial independence.",
    author: "Anonymous",
    tag: "Savings"
  },
  {
    quote: "A budget is telling your money where to go instead of wondering where it went.",
    author: "John C. Maxwell",
    tag: "Budgeting"
  },
  {
    quote: "The quickest way to double your money is to fold it in half and put it back in your pocket.",
    author: "Will Rogers",
    tag: "Discipline"
  },
  {
    quote: "You must gain control over your money or the lack of it will forever control you.",
    author: "Dave Ramsey",
    tag: "Control"
  },
  {
    quote: "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who doesn't, pays it.",
    author: "Albert Einstein",
    tag: "Growth"
  },
  {
    quote: "Small daily improvements over time lead to stunning long-term results.",
    author: "Robin Sharma",
    tag: "Habits"
  },
  {
    quote: "Rich people stay rich by living like they're broke. Broke people stay broke by living like they're rich.",
    author: "Anonymous",
    tag: "Lifestyle"
  }
];

export function getRandomQuote(seed) {
  if (typeof seed === 'number') {
    return FINANCIAL_QUOTES[Math.abs(seed) % FINANCIAL_QUOTES.length];
  }
  const index = Math.floor(Math.random() * FINANCIAL_QUOTES.length);
  return FINANCIAL_QUOTES[index];
}
