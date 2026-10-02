# Поддомен web1.chikirao.ru

Для поддомена GitHub Pages рекомендует CNAME. A-запись связывает имя с IP-адресом,
а DNS сам по себе не делает HTTP-переадресацию. Здесь достаточно привязать поддомен
к этому сайту.

1. Открой [Settings → Pages](https://github.com/chikirao/web_1_0_story/settings/pages).
   Источник публикации: **Deploy from a branch**, ветка **main**, папка **/(root)**.
2. В **Custom domain** введи `web1.chikirao.ru` и нажми **Save**.
   При публикации из ветки GitHub добавит в её корень файл `CNAME`.
3. В DNS-панели, которая обслуживает зону `chikirao.ru`, добавь запись:

   | Тип | Имя / Host | Значение / Target | TTL |
   | --- | --- | --- | --- |
   | CNAME | web1 | chikirao.github.io | 3600 или Auto |

   Если панель требует полное имя, укажи `web1.chikirao.ru`.
   Значение задаётся без `https://` и без `/web_1_0_story/`.
   Если для имени `web1` уже есть A, AAAA или CNAME, замени конфликтующие записи.
   Записи основного домена `chikirao.ru` менять не нужно.
4. Дождись успешной DNS-проверки на GitHub и включи **Enforce HTTPS**.
   Распространение DNS и доступность этой настройки могут занять до 24 часов.
5. Сайт будет открываться по адресу [web1.chikirao.ru](https://web1.chikirao.ru/).

Проверка в PowerShell:

```powershell
Resolve-DnsName web1.chikirao.ru -Type CNAME
```

В ответе должно быть `chikirao.github.io`.
После сохранения Custom domain подтяни добавленный GitHub коммит командой `git pull --ff-only`.

Источник: [официальная инструкция GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain).
