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
  - heading "Přihlášení" [level=1]
  - paragraph: Přihlaste se do svého účtu
  - text: E-mail
  - textbox "E-mail"
  - text: Heslo
  - textbox "Heslo"
  - button "Přihlásit se"
  - paragraph:
    - text: Nemáte účet?
    - link "Zaregistrujte se":
      - /url: /auth/register
- alert
```