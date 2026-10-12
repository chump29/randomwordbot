# ![RandomWordBot](./utils/images/randomwordbot.webp) RandomWordBot

> - RandomWordBot for Discord

---

![Bun](https://img.shields.io/badge/Bun-1.4.3-informational?style=plastic&logo=bun) &nbsp;
![discord.js](https://img.shields.io/badge/discord.js-^14.27.0-informational?style=plastic&logo=discord.js) &nbsp;
![Drizzle](https://img.shields.io/badge/Drizzle-1.0.0--rc.4-informational?style=plastic&logo=drizzle)
![SQLite](https://img.shields.io/badge/SQLite-3.53.4-informational?style=plastic&logo=sqlite)

![CodeQL](https://github.com/chump29/randomwordbot/workflows/CodeQL/badge.svg) &nbsp;
![Coverage](https://img.shields.io/badge/Coverage-83.33%25-success?style=plastic&logo=jest)

![NO AI](https://img.shields.io/badge/NO-AI-orange?style=plastic "NO AI") &nbsp;
![License](https://img.shields.io/github/license/chump29/randomwordbot?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3") &nbsp; <!-- markdownlint-disable MD013 -->
![CVE Scan](https://img.shields.io/badge/CVE%20Scan-Pass-success?style=plastic&logo=owasp "CVE Scan")

---

### What it does: <!-- markdownlint-disable-line MD001 -->

- Watches for a random word

---

### 🔗 Invite Link <!-- markdownlint-disable-line MD001 -->

[Add RandomWordBot](https://discord.com/oauth2/authorize?client_id=1496090376824688690&permissions=84992&integration_type=0&scope=bot)

---

### 🖥️ Discord <!-- markdownlint-disable-line MD001 -->

#### Role Permissions:

|   ⚙️ Permission    |
|:------------------:|
|    ViewChannel     |
|    SendMessages    |
|     EmbedLinks     |
| ReadMessageHistory |

#### Commands:

|      📋 Task      |      🔧 Command       | ⚙️ Permission |
|:-----------------:|:---------------------:|:-------------:|
|       Info        |        `/info`        |     None      |
| Show Leaderboard  |    `/leaderboard`     |     None      |
|       Ping        |        `/ping`        |     None      |
|   Reset Points    | `/reset <@user\|all>` | Administrator |
|    Word Status    |       `/status`       | Administrator |
| Generate New Word |        `/word`        | Administrator |

---

### 🖧 Docker

#### Environment Variables:

|     📝 Description      | 📌 Variable |   {...} Value    |
|:-----------------------:|:-----------:|:----------------:|
|        Activity         |  ACTIVITY   |    Listening     |
|       Channel ID        | CHANNEL_ID  |      \<id>       |
| Embed Color<sup>1</sup> |    COLOR    |     #78866b      |
|         DB Name         |   DB_NAME   | randomwordbot.db |
|         DB Path         |   DB_PATH   |       ./db       |
|          Debug          |    DEBUG    |  true/**false**  |
|   Maximum Word Length   | MAX_LENGTH  |  0<sup>2</sup>   |
|   Minimum Word Length   | MIN_LENGTH  |  3<sup>3</sup>   |
|        Bot Name         |    NAME     |  RandomWordBot   |
|         Points          |   POINTS    |  1 <sup>4</sup>  |
|        Bot Token        |    TOKEN    |     \<token>     |

###### <sup>1</sup> #RRGGBB format <!-- markdownlint-disable-line MD001 -->

###### <sup>2</sup> 0=disable (will default to *maximum* word length), or >= 2 *(must be >= `MIN_LENGTH`)*

###### <sup>3</sup> 0=disable (will default to *minimum* word length), or >= 2

###### <sup>4</sup> Must be > 0

##### From `@postfmly/logoserver`:

| 📝 Description | 📌 Variable |    {...} Value     |
|:--------------:|:-----------:|:------------------:|
|   Logo Name    |  LOGO_NAME  | randomwordbot.webp |
|   Local Path   |  LOGO_PATH  |   ./utils/images   |
|      Port      |  LOGO_PORT  | **Random**/[port]  |
|    Logo URL    |  LOGO_URL   |       \<url>       |

##### From `@postfmly/checkrate`:

###### *NOTE: Rate limited to 1 request per 1 second*

#### Deployment:

|  📜 Script  |  🔧 Command   |
|:-----------:|:-------------:|
|    Full     | `./build.sh`  |
| Docker Only | `./docker.sh` |

---

### 📄 Documentation

### Generate:

```bash
./docs.sh
```

---

### 🛰️ Git & CI/CD

- **Pre-Commit:** Staged files are automatically linted
- **Github Actions:** Builds and pushes images to repository
  - latest
    - amd64
    - arm64
