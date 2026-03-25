> **Navigation**: [← MLOps](13_MLOps_Production.md) | [Back to Index](00_INDEX.md)

# 🎮 Reinforcement Learning — Progressive Mastery Guide

> _"RL is the only branch of ML that learns by DOING — not from data someone else collected. The agent shapes its own future training data. This is both its power and its danger."_

---

# PART 0: The 5W+H Framework

| Question | Reinforcement Learning Context |
| :--- | :--- |
| **WHAT** | An agent learns to make decisions by interacting with an environment, receiving rewards or penalties as feedback, with the goal of maximizing cumulative reward. |
| **WHY** | Some problems have no labeled training data — you can only learn by trying. Games, robotics, resource scheduling, drug dosing: the "right action" isn't known in advance. |
| **WHEN** | When: (1) you can define a reward signal, (2) the agent can interact with the environment (real or simulated), (3) sequential decisions matter. |
| **WHERE** | Game playing (AlphaGo), robot locomotion, trading strategies, RLHF for LLMs, data center cooling (DeepMind), traffic signal control. |
| **WHO** | Bellman (1957, dynamic programming) → Watkins (1989, Q-learning) → Mnih et al. (2013, DQN) → Schulman et al. (2017, PPO) → OpenAI (2019, RLHF). |
| **HOW** | Agent observes state → selects action → environment transitions to new state + gives reward → repeat → learn policy that maximizes total reward. |

---

# PART 1: The Foundation — Markov Decision Processes (MDP)

---

```
ANALOGY: RL is like training a dog.
  State:   What the dog sees (ball thrown, park setting)
  Action:  What the dog does (run, stay, bark)
  Reward:  Treat (+1) or scolding (-1)
  Policy:  The dog's learned strategy (chase ball = get treat)
  
  BUT unlike dog training, the RL agent tries ALL possible actions,
  remembers what worked, and builds a MATHEMATICAL MODEL of what to do.

FORMAL DEFINITION — A Markov Decision Process (MDP):
  Tuple: (S, A, P, R, γ)
  
  S: State space         — all possible situations the agent can be in
  A: Action space        — all possible actions the agent can take
  P: Transition function — P(s' | s, a) = prob of going to s' from s via action a
  R: Reward function     — R(s, a, s') = reward for taking action a in state s
  γ: Discount factor     — 0 < γ < 1: how much future rewards are worth now
  
  THE MARKOV PROPERTY:
  "The future depends only on the present state, not the past history."
  P(sₜ₊₁ | sₜ, aₜ, sₜ₋₁, aₜ₋₁, ...) = P(sₜ₊₁ | sₜ, aₜ)
  
  This is the KEY ASSUMPTION of RL. If it holds:
  You don't need to remember WHERE you came from — only WHERE you are.
  
RETURN (Cumulative Reward):
  Gₜ = rₜ₊₁ + γ·rₜ₊₂ + γ²·rₜ₊₃ + ... = Σₖ₌₀^∞ γᵏ·rₜ₊ₖ₊₁
  
  γ = 0.99: care a lot about future (patient agent)
  γ = 0.1:  care mostly about immediate reward (myopic agent)
  
  WHY DISCOUNT?
  1. Mathematical convergence (infinite sums converge for γ < 1)
  2. Uncertainty: future rewards are less certain
  3. Economics: $100 today > $100 next year (time value of money)

GOAL:
  Find a POLICY π(a|s) that maximizes expected return:
  π* = argmax_π E[Gₜ | π]
```

---

# PART 2: Value Functions — The Core of RL

---

```
THE CRUCIAL INSIGHT: Don't just learn "immediate reward."
  Learn the LONG-TERM VALUE of being in each state (or taking each action).

STATE-VALUE FUNCTION V(s):
  V^π(s) = E_π[Gₜ | Sₜ = s]
  "Expected return starting from state s, following policy π forever."
  
  ANALOGY: Chess position evaluation.
  A grandmaster can look at a board position and say:
  "This position is worth +0.8 (white is winning)."
  This is V(s) — the value of a state, accounting for all future play.

ACTION-VALUE FUNCTION Q(s, a):
  Q^π(s, a) = E_π[Gₜ | Sₜ = s, Aₜ = a]
  "Expected return from taking action a in state s, then following π."
  
  WHY Q IS OFTEN MORE USEFUL THAN V:
  Given V(s), you need P(s'|s,a) to pick the best action (model-based).
  Given Q(s,a), you just pick argmax_a Q(s,a) — no model needed! (model-free)

THE BELLMAN EQUATION — The Fundamental Recursion:
  V^π(s) = Σ_a π(a|s) · Σ_s' P(s'|s,a) · [R(s,a,s') + γ·V^π(s')]
  
  In words: "The value of state s = expected immediate reward +
             γ × (expected value of where I'll end up)"
  
  ANALOGY: Pricing a house.
  House value = annual rental income + (discounted value of house next year)
  This is a RECURSIVE EQUATION — house value depends on its own future value!
  
  BELLMAN OPTIMALITY EQUATION:
  V*(s) = max_a Σ_s' P(s'|s,a) · [R(s,a,s') + γ·V*(s')]
  Q*(s,a) = Σ_s' P(s'|s,a) · [R(s,a,s') + γ · max_a' Q*(s',a')]
  
  If we find Q*, we're done: π*(s) = argmax_a Q*(s,a)
```

---

# PART 3: Q-Learning — Model-Free Value Learning

---

```
PROBLEM: We usually DON'T KNOW P(s'|s,a) (the transition probabilities).
  Real environments are complex (we don't have a formula for chess moves).
  
INSIGHT: We can ESTIMATE Q* from experience without knowing P!
  Each time we take action a in state s and observe reward r and next state s':
  → We have ONE sample of what Q(s,a) "should" be:
    Target = r + γ · max_a' Q(s', a')
  → Update our estimate toward this target:
    Q(s,a) ← Q(s,a) + α[Target - Q(s,a)]

TABULAR Q-LEARNING (for small, discrete state/action spaces):

  Initialize Q(s,a) = 0 for all s, a
  
  For each episode:
    Initialize state s
    For each step:
      ε-GREEDY ACTION SELECTION:
        With probability ε: choose random action (explore!)
        With probability 1-ε: choose argmax_a Q(s,a) (exploit)
      
      Execute action a → observe reward r and next state s'
      
      BELLMAN UPDATE:
        Q(s,a) ← Q(s,a) + α · [r + γ·max_a' Q(s',a') - Q(s,a)]
        ↑ current estimate   ↑ TD error: how wrong were we?
      
      s ← s'

TEMPORAL DIFFERENCE (TD) ERROR:
  δ = r + γ·max_a' Q(s',a') - Q(s,a)
  = "How surprising was this transition?"
  
  δ > 0: It was BETTER than expected → increase Q(s,a)
  δ < 0: It was WORSE than expected  → decrease Q(s,a)
  δ = 0: Exactly as expected → no update needed
  
  ANALOGY: TD learning is like getting periodic salary reviews.
  Your "expected salary" is Q(s,a). Each new experience gives you
  a signal of whether your estimate was too high or too low.
  You nudge toward the signal (α controls how much).
```

```python
import numpy as np
import random
from collections import defaultdict

class QLearningAgent:
    """Tabular Q-Learning for GridWorld"""
    def __init__(self, n_actions, alpha=0.1, gamma=0.99, epsilon=0.1):
        self.Q = defaultdict(lambda: np.zeros(n_actions))  # Q-table: state → action values
        self.alpha = alpha      # learning rate
        self.gamma = gamma      # discount factor
        self.epsilon = epsilon  # exploration probability
        self.n_actions = n_actions

    def select_action(self, state):
        """ε-greedy policy"""
        if random.random() < self.epsilon:
            return random.randint(0, self.n_actions - 1)  # explore
        return int(np.argmax(self.Q[state]))               # exploit

    def update(self, state, action, reward, next_state, done):
        """Bellman update"""
        current_q = self.Q[state][action]
        
        if done:
            target = reward  # no future if episode ended
        else:
            target = reward + self.gamma * np.max(self.Q[next_state])
        
        td_error = target - current_q
        self.Q[state][action] += self.alpha * td_error
        return abs(td_error)   # track learning progress

    def train(self, env, n_episodes=1000):
        rewards_per_episode = []
        for episode in range(n_episodes):
            state = env.reset()
            total_reward = 0
            done = False
            
            while not done:
                action = self.select_action(state)
                next_state, reward, done, _ = env.step(action)
                self.update(state, action, reward, next_state, done)
                state = next_state
                total_reward += reward
            
            rewards_per_episode.append(total_reward)
            
            # Decay epsilon (explore less as we learn more)
            self.epsilon = max(0.01, self.epsilon * 0.995)
        
        return rewards_per_episode
```

---

# PART 4: Deep Q-Networks (DQN) — Q-Learning at Scale

---

```
PROBLEM WITH TABULAR Q-LEARNING:
  State space is HUGE in real problems.
  Atari Pong: pixels = 84×84×4 frames = ~28,000 possible input values
  Possible states: 4^(84×84) = astronomically large!
  
  A table can't store Q values for every state.

DQN SOLUTION (DeepMind, 2013):
  Replace the Q-table with a NEURAL NETWORK!
  Q(s, a; θ) ≈ Q*(s, a)
  
  Input:  state (raw pixels, encoded state)
  Output: one Q-value per action (e.g., for Pong: [Q(left), Q(right), Q(stay)])
  
  BUT naive use of neural networks with TD learning is UNSTABLE.
  Why? Two problems:
  
  1. CORRELATED SAMPLES: Sequential steps (s,a,r,s') are highly correlated.
     Neural networks trained on correlated data → diverge!
  
  2. MOVING TARGETS: The target r + γ·max Q(s',a') changes as Q changes.
     It's like chasing your own tail!

DQN TRICK 1 — EXPERIENCE REPLAY:
  Store transitions (s, a, r, s', done) in a REPLAY BUFFER of size N.
  Sample RANDOM MINI-BATCHES from the buffer for training.
  
  WHY: Random samples are UNCORRELATED → stable training!
  BONUS: Reuse each experience multiple times (data efficiency).
  
DQN TRICK 2 — TARGET NETWORK:
  Keep TWO networks:
  Online network Q(s,a; θ): updated at every step
  Target network Q(s,a; θ⁻): updated every C steps (copy of online)
  
  Target = r + γ · max_a' Q(s', a'; θ⁻)   ← uses the FROZEN target net
  
  WHY: Targets change slowly → stable TD learning!
```

```python
import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
import random

class DQNetwork(nn.Module):
    """Q-Network: state → Q-values for each action"""
    def __init__(self, state_dim, n_actions, hidden=128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden), nn.ReLU(),
            nn.Linear(hidden, hidden),    nn.ReLU(),
            nn.Linear(hidden, n_actions)  # one Q-value per action
        )
    def forward(self, x): return self.net(x)

class DQNAgent:
    def __init__(self, state_dim, n_actions):
        self.n_actions = n_actions
        self.online_net  = DQNetwork(state_dim, n_actions)  # trained every step
        self.target_net  = DQNetwork(state_dim, n_actions)  # frozen target
        self.target_net.load_state_dict(self.online_net.state_dict())
        
        self.optimizer   = optim.Adam(self.online_net.parameters(), lr=1e-4)
        self.replay      = deque(maxlen=10_000)   # experience replay buffer
        self.batch_size  = 64
        self.gamma       = 0.99
        self.epsilon     = 1.0
        self.target_freq = 100   # update target every N steps
        self.steps       = 0

    def act(self, state):
        if random.random() < self.epsilon:
            return random.randrange(self.n_actions)
        with torch.no_grad():
            return self.online_net(torch.FloatTensor(state)).argmax().item()

    def remember(self, s, a, r, s_, done):
        self.replay.append((s, a, r, s_, done))

    def learn(self):
        if len(self.replay) < self.batch_size:
            return  # not enough experience yet
        
        batch = random.sample(self.replay, self.batch_size)
        s, a, r, s_, done = zip(*batch)
        
        s    = torch.FloatTensor(s)
        a    = torch.LongTensor(a)
        r    = torch.FloatTensor(r)
        s_   = torch.FloatTensor(s_)
        done = torch.FloatTensor(done)
        
        # Current Q-values for chosen actions
        q_values = self.online_net(s).gather(1, a.unsqueeze(1)).squeeze(1)
        
        # Target Q-values (using frozen target network)
        with torch.no_grad():
            max_next_q = self.target_net(s_).max(1)[0]
            targets = r + self.gamma * max_next_q * (1 - done)
        
        loss = nn.SmoothL1Loss()(q_values, targets)  # Huber loss (robust to outliers)
        self.optimizer.zero_grad(); loss.backward(); self.optimizer.step()
        
        # Update target network periodically
        self.steps += 1
        if self.steps % self.target_freq == 0:
            self.target_net.load_state_dict(self.online_net.state_dict())
        
        self.epsilon = max(0.01, self.epsilon * 0.999)  # decay exploration
```

---

# PART 5: Policy Gradient — PPO (The Modern Standard)

---

```
VALUE-BASED (DQN): Learn Q, then derive policy from Q.
  Problem: Only works with DISCRETE actions!
  Can't do: argmax over continuous joint (100 robot joints)

POLICY GRADIENT: Learn the policy DIRECTLY!
  Parameterize π(a|s; θ) directly as a neural network.
  Optimize θ to maximize expected return.
  
  THE POLICY GRADIENT THEOREM:
  ∇_θ J(θ) = E_π[∇_θ log π(a|s; θ) · Q^π(s,a)]
  
  KEY INSIGHT: Increase probability of actions with HIGH return,
               Decrease probability of actions with LOW return.
  
  "REINFORCE" ALGORITHM:
  For each episode:
    Collect trajectory: (s₀,a₀,r₀), (s₁,a₁,r₁), ..., (sₜ,aₜ,rₜ)
    Compute returns: Gₜ = Σₖ γᵏ·rₜ₊ₖ
    For each step t:
      θ ← θ + α · ∇_θ log π(aₜ|sₜ; θ) · Gₜ
  
  PROBLEM: High variance (rare good returns → noisy gradients)
  SOLUTION: Subtract a BASELINE:
  θ ← θ + α · ∇_θ log π(aₜ|sₜ; θ) · (Gₜ - b)
  Best baseline: V(sₜ) → this gives the ADVANTAGE:
  A(s,a) = Q(s,a) - V(s)  ("How much BETTER than average was this action?")

ACTOR-CRITIC:
  ACTOR:  Policy network π(a|s; θ) — decides what to do
  CRITIC: Value network V(s; φ) — judges how good the state is
  
  Train them together: Critic guides Actor's updates.
  Actor improves policy. Critic improves its value estimates.

PROXIMAL POLICY OPTIMIZATION (PPO) — 2017, OpenAI:
  The most widely used RL algorithm. Why?
  Problem with vanilla policy gradient: large gradient steps → policy collapses.
  One bad update → agent forgets everything!
  
  PPO CLIP OBJECTIVE:
  L^CLIP(θ) = E[min(rₜ(θ) · Âₜ, clip(rₜ(θ), 1-ε, 1+ε) · Âₜ)]
  
  rₜ(θ) = π(aₜ|sₜ; θ) / π(aₜ|sₜ; θ_old)   (probability ratio)
  Âₜ:     advantage estimate (how good was this action vs average?)
  ε:      clip ratio (typically 0.2)
  
  INTUITION:
  If Âₜ > 0 (action was good): INCREASE its probability, but don't go too far.
     clip prevents rₜ > 1.2 → limit the "reward" for any single update.
  If Âₜ < 0 (action was bad):  DECREASE its probability, but don't go too far.
     clip prevents rₜ < 0.8 → don't panic-decrease probability.
  
  WHY PPO IS UBIQUITOUS:
  ✅ Simple to implement
  ✅ Robust to hyperparameters
  ✅ Works in continuous AND discrete action spaces
  ✅ Used for: Robot locomotion, game playing, RLHF for ChatGPT!
```

---

# PART 6: RLHF — How ChatGPT Was Trained

---

```
Most relevant RL application today: RLHF (Reinforcement Learning from Human Feedback)
This is how GPT-4, Claude, Gemini were aligned to be helpful.

THE THREE-STAGE PIPELINE:

STAGE 1 — SUPERVISED FINE-TUNING (SFT):
  Start: Pretrained language model (predicts next token)
  Do:    Fine-tune on high-quality demonstration data
         (humans write ideal responses to prompts)
  Result: A decent "assistant" model, but not yet aligned.

STAGE 2 — REWARD MODEL TRAINING:
  For many prompts, generate multiple responses from SFT model.
  Human annotators RANK the responses: R₁ > R₂ > R₃
  Train a REWARD MODEL to predict human preference scores.
  
  Loss: -Σ_{(rw, rl)} log(σ(reward(rw) - reward(rl)))
  rw = preferred response, rl = rejected response
  σ = sigmoid
  
  The reward model learns: "what do humans find helpful/harmless/honest?"

STAGE 3 — PPO FINE-TUNING (RL):
  Use the reward model as the reward function.
  Agent = language model, Action = generate next token, State = context
  Run PPO: increase probability of responses the reward model scores high.
  
  BUT add a KL penalty to prevent over-optimization!
  reward = reward_model(response) - β · KL[π || π_SFT]
  
  KL penalty: don't stray too far from the SFT model.
  Without it: the LM finds adversarial responses that "game" the reward model.
  (e.g., spitting out gibberish that happens to score high)

RESULT: A model that generates helpful, harmless, honest responses.
  The RL objective = human preference ≈ "what would a good person say?"

ALTERNATIVES TO RLHF:
  DPO (Direct Preference Optimization) — 2023:
  Skips the reward model! Directly optimizes on preference pairs.
  Loss: -E[log σ(β·log π(rw)/π_ref - β·log π(rl)/π_ref)]
  
  Simpler than PPO, often comparable quality, now widely preferred.
```

---

# Quick Reference — RL Algorithm Comparison

| Algorithm | Type | Action Space | Key Property | Use When |
|---|---|---|---|---|
| **Q-Learning** | Value-based | Discrete | Tabular, simple | Small discrete state/action |
| **DQN** | Value-based | Discrete | Neural Q-function, replay buffer | Large state space, discrete actions |
| **REINFORCE** | Policy gradient | Both | Simple, high variance | Proof-of-concept |
| **A3C/A2C** | Actor-Critic | Both | Async/sync parallel workers | Moderate complexity |
| **PPO** | Actor-Critic | Both | Clipped objective, stable | Default choice for most problems |
| **SAC** | Actor-Critic | Continuous | Entropy-augmented, sample efficient | Continuous control (robotics) |
| **AlphaZero** | MCTS + RL | Discrete | Self-play, perfect information | Board games |
| **RLHF** | PPO + RM | Token | Human preference | LLM alignment |

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Neural networks (function approximators)** | [Deep Learning](07_Deep_Learning_Fundamentals.md) |
| **RLHF → LLM alignment** | [LLM & RAG](10_LLM_RAG_Applications.md) — RLHF section |
| **PPO → BERT/GPT** | [NLP Complete](08_NLP_Complete.md) — RLHF in LLMs |
| **Optimization (Adam, SGD)** | [Deep Learning](07_Deep_Learning_Fundamentals.md) — Training Optimization |

---

> **Navigation**: [← MLOps](13_MLOps_Production.md) | [Back to Index](00_INDEX.md)
