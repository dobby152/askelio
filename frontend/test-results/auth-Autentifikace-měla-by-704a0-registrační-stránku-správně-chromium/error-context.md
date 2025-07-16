# Page snapshot

```yaml
- navigation:
  - link "Askelio":
    - /url: /
  - link "Přihlášení":
    - /url: /auth/login
  - link "Registrace":
    - /url: /auth/register
- main:
  - heading "Registrace" [level=1]
  - paragraph: Vytvořte si nový účet
  - text: E-mail
  - textbox "E-mail"
  - text: Heslo
  - textbox "Heslo"
  - text: Potvrdit heslo
  - textbox "Potvrdit heslo"
  - button "Zaregistrovat se"
  - paragraph:
    - text: Už máte účet?
    - link "Přihlaste se":
      - /url: /auth/login
- alert
```