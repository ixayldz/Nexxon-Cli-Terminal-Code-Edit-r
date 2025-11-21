# P1 (MVP) Planning

Bu dizin, PRD (Approved) doÄŸrultusunda P1 iÃ§in Epic/Issue planÄ±nÄ± iÃ§erir.

## Ä°Ã§erik
- `p1-plan.yml`: Epic ve issue baÅŸlÄ±klarÄ±, aÃ§Ä±klamalar, etiketler, milestone.

## Ã–n KoÅŸullar
- GitHub CLI (gh)
- Repo eriÅŸimi (push/issue oluÅŸturma yetkisi)

## KullanÄ±m
1) Etiketler ve milestone otomatik oluÅŸturularak issueâ€™larÄ±n aÃ§Ä±lmasÄ±:

```bash
npm install
npm run plan:issues
```

> Not: `gh` kurulu deÄŸilse, script gerekli `gh issue create` komutlarÄ±nÄ± stdoutâ€™a yazar.

2) Makefile ile ÅŸema doÄŸrulamasÄ±:

```bash
make validate
```

## Notlar
- Epic etiketleri `epic/E#` formatÄ±nda oluÅŸturulur (Ã¶r. `epic/E1`).
- Milestone adÄ±: `P1 (MVP)`.
- Ä°htiyaca gÃ¶re `p1-plan.yml` Ã¼zerinde gÃ¶rev alanlarÄ± (area/...) ve Ã¶ncelikler dÃ¼zenlenebilir.


## GitHub Projects (Opsiyonel)
- Plan dosyasındaki `project.title` doluysa script, org/user altında bir Project (v2) oluşturur veya mevcutsa kullanır.
- Issue’lar oluşturulduktan sonra projeye item olarak eklenir (varsayılan Status alanı ayarlanmaz; gerekirse manuel veya ilave script ile düzenlenebilir).

### Kullanım
```bash
npm run plan:issues
# gh CLI yoksa gerekli komutlar stdout’a yazılır
```

## Status Mapping
- `planning/status-mapping.yaml` dosyası ile label ve event › Project Status eşlemeleri yönetilir.
- Varsayılanlar dosyada örnek olarak bulunur; değiştirilebilir.
- issue-status-sync workflow, mapping dosyasını okuyup uygun Status değerini uygular.
