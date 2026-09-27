# T3 Code — Türkçe

[English](./README.md) · **Türkçe**

T3 Code'un Türkçe arayüzlü sürümü. Bu bir **topluluk yapımıdır**; resmî bir
Ping.gg ürünü değildir.

## Neden var?

T3 Code [MIT lisanslı](LICENSE) ve açıkça fork'a açık: _"A large number of our
users run forks."_ Bu deponun arayüzü ise tek dillidir. Bu fork, o boşluğu
kapatır — arayüz metinleri katalogdan gelir, arayüz dili ayarlardan seçilir,
İngilizce her yerde çalışmaya devam eder.

**Bu çaba Türkçe konuşan herkes içindir.** İngilizce konuşan bir kullanıcı
bu build'i kullanmak zorunda değil ve hiçbir şey kaybetmez.

## Kurulum

Sürümler [Releases](https://github.com/xrehzen/t3code/releases) sayfasında.
`x86_64` Linux için `T3-Code-<sürüm>-x64.AppImage` dosyasını indirin:

```sh
chmod +x T3-Code-*-x64.AppImage
./T3-Code-*-x64.AppImage
```

Uygulama dilini **Ayarlar → Genel → Arayüz dili**'nden değiştirin. Varsayılan
**Sistem**'dir: Türkçe bir işletim sistemi Türkçe açılır, İngilizce bir sistem
İngilizce açılır. Dili elle de seçebilirsiniz; bu tercih cihaz başına kaydedilir
ve sunucuya gönderilmez.

## Neler çevrildi

| Alan                                                                                                                                       | Kapsam                         |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Uygulama menüsü, güncelleme diyalogları, splash, sağ tık menüsü                                                                            | ~120 metin                     |
| Kenar çubuğu, komut paleti, komut satırı, diyaloglar, toast'lar                                                                            | tamamı                         |
| Ayarlar panelleri (bağlantılar, entegrasyonlar, tanılama, temalar, sağlayıcılar, kısayollar, depolama, kaynak denetimi, anlık görüntüler…) | ~2.946 katalog anahtarı        |
| Electron'un kendi menü etiketleri (quit, copy, paste, yardım…)                                                                             | paketlenmiş `tr.pak` sayesinde |

Çeviri **kaynak kodda**, paketlenmiş ikilide değil. Bu yüzden upstream
güncellemeleriyle birlikte taşınabilir ve topluluk katkısına açıktır.

## Türkçeye özgü üç şey

Bunlar bir çeviri kararı değil, bir doğruluk kararıydı:

**`I` ve `ı`.** `toLowerCase()` Türkçe kurallarını uygulamaz, `I` harfini `i`
yapar. Sonuç: `NOT_LOGGED_IN` → `not_logged_ın` olur ve komut kendisiyle
eşleşmez. Arama normalleştirmesi bu yüzden locale'dan bağımsız ama
Türkçe-duyarlı bir katlama kullanır; hem `"yapilandirma"` yazan kullanıcı hem de
`NOT_LOGGED_IN` arayan kullanıcı doğru sonucu alır.

**Yüzde işareti.** Türkçede `%50`, İngilizce'de `50%`. Şablon literal yerine
`Intl.NumberFormat` kullanılır.

**Sıralama.** Türkçe collation'ı `ı` ile `i` farkını birincil sayar ve `ı`'yı
`i`'den önce getirir. Proje ve ortam listeleri bu yüzden masaüstünde ve
tarayıcıda aynı sırada görünür.

## Kaynaktan derleme

```sh
git clone https://github.com/xrehzen/t3code.git
cd t3code
pnpm install

# İngilizce (upstream'e sadık)
T3CODE_DEFAULT_LOCALE=en \
  vp run dist:desktop:artifact --platform linux --target AppImage --arch x64 \
    --output-dir release/en

# Türkçe
T3CODE_DEFAULT_LOCALE=tr \
  vp run dist:desktop:artifact --platform linux --target AppImage --arch x64 \
    --output-dir release/tr
```

Gereken ön koşullar (`docs/operations/development.md`):

```sh
sudo pacman -S rust base-devel libsecret pkgconf imagemagick
```

İki build de tam olmalıdır: locale build sırasında web paketine gömülür, bu
yüzden ikincisinde `--skip-build` kullanılmaz.

## Upstream ile ilişki

Bu fork, [`pingdotgg/t3code`](https://github.com/pingdotgg/t3code) üzerine
kuruludur. Upstream, bu depoya kabul etmediği için büyük bir lokalizasyon PR'ı
göndermedik — onun yerine küçük ve odaklı hata düzeltmeleri öneriyoruz.

Upstream'deki `#10900` ve `#12563` numaralı i18n önerilerini izliyoruz. Onlardan
biri birleşirse Türkçe katalog doğrudan onların üzerine oturur.

## Lisans

MIT — upstream'in lisansı aynen korunur. Telif bildirimi ve lisans metni
`LICENSE` dosyasındadır. Bu fork resmî olmayan bir topluluk yapımıdır;
Ping.gg veya T3 Code ekibi tarafından desteklenmemektedir.
