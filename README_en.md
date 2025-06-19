# Welcome to your Something2eat for Soms!

Get ready to explore a small universe where a smart Som (or not so smart!) fights to survive! This is the definitive manual to understand how your simulation works and how your Som will try to dominate this peculiar ecosystem.

---

## Discover the World:
Your Som will live on a *20x20* grid, and each cell hides something different!

* **Grass (`p`)**: The simplest terrain! Your Som can move freely here.

* **Water (`a`)**: Be careful! Only Soms with the **Swimming** ability can pass without problems. If your Som is a "drunk" and insists on going into the water, it might drown!

* **Mountain (`m`)**: A challenge! Only Soms with the **Climbing** ability can conquer these cells. "Drunk" Soms are a special case: if they insist enough, they might trip and get through!

* **Rock (`r`)**: Stop! This is an impenetrable wall. Your Som will not be able to pass through here.

* **Tree (`A`)**: A touch of nature! Trees are part of the landscape and your Som can pass through them.

* **Coconut Super (`C`)**: The treasure of the world! This is the food your Som needs to recharge energy and keep going.

---

## Get to Know Your Som:
You control a single Som, identified with an *ID*. You will observe its properties and how it behaves in this micro-world:

**Energy**: Starts with 100 points. Every movement reduces it, so be careful! If it reaches 0, your Som... well, you know.

**Life Status**: You will know instantly if your Som is alive and kicking if it is any color but red; if it is red and has a line through it, it's already part of the landscape.

**Food Search**: If your Som's energy drops below 70, or if it's a "glutton" Som (one of those who are always hungry!), it will desperately search for the nearest *Coconut Super*.

**Stuck?**: If your Som repeatedly tries to move to the same spot (even diagonally!) 3 consecutive times without advancing, it will feel "stuck" and look for a new direction. Nobody wants a frustrated Som!

### Unique Abilities and Personalities:
Every time a simulation starts, your Som will be born with a special combination of these characteristics. Discover what kind of explorer you've got!

**Swimming Ability**: The ticket to cross the water!

* **Probability of being born with it**: 20%.

* **Can it be learned?** Yes! If your Som insists on getting into the water 80 times without knowing how to swim, it might learn the skill through sheer tenacity (if it doesn't have another opposing skill or is drunk)!

**Climbing Ability**: The key to conquering the mountains!

* **Probability of being born with it**: 20%.

* **Can it be learned?** Yes! If your Som tries to climb 80 times without the skill, it might learn it through effort (if it doesn't have another opposing skill or is drunk)!

**Lazy Som**: (30% probability)

* These Soms are not the type to learn new tricks. They are born with what they have and stay that way!

* **Important**: They will never have both Swimming and Climbing abilities at the same time, neither at birth nor by learning.

**Glutton Som**: (15% probability)

* Always hungry! No matter how much energy it has, its number one priority will always be to find *Coconut Super*.

**Prodigy Som**: (15% probability)

* The elite! These Soms can be born with Swimming, Climbing, or even **both** abilities.

* **The best part**: If they are not born with any of these abilities, they can learn it through effort! They are the only ones who can be true "masters" of the world (having both abilities).

**Drunk Som**: (20% probability)

* A bit unpredictable! It moves without a clear plan and its energy can fluctuate more than usual.

* **No learning**: They cannot learn abilities through effort.

* **Water, its nemesis**: If it tries to enter the water 15 consecutive times unsuccessfully, exhaustion will overcome it and it will drown!

* **Mountain, its challenge**: If it insists on climbing the mountain 10 times, it will succeed by sheer miracle, but then it will have to try again if it wants to repeat!

* **Important**: Like the lazy ones, they will never have both Swimming and Climbing abilities at the same time.

---

## Your Personal Records:
Want to see how fast your Som has finished each simulation? Here, times are saved, sorted from fastest to slowest so you always see your best score at the top!

## Take Control!

* **Start Simulation**: Press here to begin a new adventure. The world will be created, your Som will be born, and the simulation will start automatically.

* **Next Step**: Do you want to go slower and observe each movement? Use this button to advance the simulation turn by turn.

* **Show/Hide History**: If you want to review your past achievements or keep the interface clean, this button allows you to toggle the visibility of your history.
