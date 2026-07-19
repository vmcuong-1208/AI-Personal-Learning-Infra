import { Camera, CreditCard, Languages, LockKeyhole, Mail, MonitorSmartphone, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";

type ProfileForm = {
  name: string;
  phone: string;
  avatar: string;
};

type SettingsMessage = {
  tone: "success" | "error" | "info";
  text: string;
} | null;

const text = {
  account: "T\u00e0i kho\u1ea3n",
  settingsTitle: "C\u00e0i \u0111\u1eb7t t\u00e0i kho\u1ea3n",
  settingsDescription: "Qu\u1ea3n l\u00fd th\u00f4ng tin c\u00e1 nh\u00e2n, b\u1ea3o m\u1eadt, giao di\u1ec7n, th\u00f4ng b\u00e1o v\u00e0 g\u00f3i d\u1ecbch v\u1ee5.",
  defaultName: "Ng\u01b0\u1eddi h\u1ecdc LearnFlow",
  personalInfo: "Th\u00f4ng tin c\u00e1 nh\u00e2n",
  avatarAlt: "\u1ea2nh \u0111\u1ea1i di\u1ec7n",
  uploadAvatar: "T\u1ea3i l\u00ean / \u0111\u1ed5i \u1ea3nh \u0111\u1ea1i di\u1ec7n",
  displayName: "T\u00ean hi\u1ec3n th\u1ecb",
  displayNamePlaceholder: "Nh\u1eadp t\u00ean hi\u1ec3n th\u1ecb",
  email: "Email",
  signedOut: "Ch\u01b0a \u0111\u0103ng nh\u1eadp",
  phone: "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i",
  save: "L\u01b0u thay \u0111\u1ed5i",
  validImage: "Vui l\u00f2ng ch\u1ecdn m\u1ed9t t\u1ec7p \u1ea3nh h\u1ee3p l\u1ec7.",
  imageTooLarge: "\u1ea2nh \u0111\u1ea1i di\u1ec7n n\u00ean nh\u1ecf h\u01a1n 1 MB \u0111\u1ec3 t\u1ea3i nhanh h\u01a1n.",
  imageReady: "\u1ea2nh m\u1edbi \u0111\u00e3 \u0111\u01b0\u1ee3c ch\u1ecdn. B\u1ea5m L\u01b0u thay \u0111\u1ed5i \u0111\u1ec3 ho\u00e0n t\u1ea5t.",
  nameError: "T\u00ean hi\u1ec3n th\u1ecb c\u1ea7n c\u00f3 \u00edt nh\u1ea5t 2 k\u00fd t\u1ef1.",
  phoneError: "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i ch\u01b0a \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng.",
  reviewError: "Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i th\u00f4ng tin tr\u01b0\u1edbc khi l\u01b0u.",
  saved: "\u0110\u00e3 l\u01b0u thay \u0111\u1ed5i th\u00f4ng tin c\u00e1 nh\u00e2n.",
  security: "B\u1ea3o m\u1eadt",
  changePassword: "\u0110\u1ed5i m\u1eadt kh\u1ea9u",
  changePasswordDescription: "C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u \u0111\u1ecbnh k\u1ef3 \u0111\u1ec3 b\u1ea3o v\u1ec7 t\u00e0i kho\u1ea3n.",
  twoFactor: "X\u00e1c th\u1ef1c hai l\u1edbp (2FA)",
  twoFactorDescription: "T\u0103ng b\u1ea3o m\u1eadt b\u1eb1ng m\u00e3 x\u00e1c th\u1ef1c khi \u0111\u0103ng nh\u1eadp.",
  enable2fa: "B\u1eadt 2FA",
  recentDevice: "Thi\u1ebft b\u1ecb \u0111\u0103ng nh\u1eadp g\u1ea7n \u0111\u00e2y",
  recentDeviceDescription: "Windows Chrome, Th\u00e0nh ph\u1ed1 H\u1ed3 Ch\u00ed Minh, h\u00f4m nay.",
  trusted: "Tin c\u1eady",
  appearance: "T\u00f9y ch\u1ecdn giao di\u1ec7n",
  theme: "Giao di\u1ec7n",
  lightMode: "Ch\u1ebf \u0111\u1ed9 s\u00e1ng",
  darkMode: "Ch\u1ebf \u0111\u1ed9 t\u1ed1i",
  language: "Ng\u00f4n ng\u1eef",
  vietnamese: "Ti\u1ebfng Vi\u1ec7t",
  english: "Ti\u1ebfng Anh",
  notifications: "Th\u00f4ng b\u00e1o",
  emailNotifications: "Nh\u1eadn th\u00f4ng b\u00e1o qua email",
  appNotifications: "Nh\u1eadn th\u00f4ng b\u00e1o trong \u1ee9ng d\u1ee5ng",
  app: "\u1ee8ng d\u1ee5ng",
  system: "H\u1ec7 th\u1ed1ng",
  learning: "H\u1ecdc t\u1eadp",
  promotion: "Khuy\u1ebfn m\u00e3i",
  plan: "G\u00f3i d\u1ecbch v\u1ee5",
  currentPlan: "G\u00f3i hi\u1ec7n t\u1ea1i: Learning OS mi\u1ec5n ph\u00ed",
  billingDescription: "L\u1ecbch s\u1eed thanh to\u00e1n s\u1ebd hi\u1ec3n th\u1ecb khi k\u1ebft n\u1ed1i backend billing.",
  upgrade: "N\u00e2ng c\u1ea5p",
  cancelPlan: "H\u1ee7y g\u00f3i",
  securityNote: "Ghi ch\u00fa b\u1ea3o m\u1eadt",
  awsNote: "C\u00e1c thay \u0111\u1ed5i \u1edf trang n\u00e0y \u0111ang \u0111\u01b0\u1ee3c l\u01b0u c\u1ee5c b\u1ed9 tr\u00ean tr\u00ecnh duy\u1ec7t. Khi k\u1ebft n\u1ed1i AWS, t\u00ean hi\u1ec3n th\u1ecb v\u00e0 s\u1ed1 \u0111i\u1ec7n tho\u1ea1i n\u00ean l\u01b0u qua Cognito user attributes ho\u1eb7c API h\u1ed3 s\u01a1; \u1ea3nh \u0111\u1ea1i di\u1ec7n n\u00ean t\u1ea3i l\u00ean S3 b\u1eb1ng URL k\u00fd t\u1ea1m th\u1eddi; m\u1ecdi thay \u0111\u1ed5i n\u00ean c\u00f3 ki\u1ec3m tra quy\u1ec1n v\u00e0 audit log."
};

function profileStorageKey(email: string) {
  return `learnflow.profile.${email}`;
}

function readSavedProfile(email: string): Partial<ProfileForm> {
  try {
    const rawProfile = window.localStorage.getItem(profileStorageKey(email));
    return rawProfile ? JSON.parse(rawProfile) : {};
  } catch {
    return {};
  }
}

function getInitials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

export function AccountSettingsPage() {
  const auth = useAuth();
  const email = auth.user?.email ?? "";
  const authName = auth.user?.name ?? text.defaultName;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedProfile = useMemo(() => readSavedProfile(email), [email]);
  const [form, setForm] = useState<ProfileForm>({
    name: savedProfile.name ?? authName,
    phone: savedProfile.phone ?? "",
    avatar: savedProfile.avatar ?? ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<SettingsMessage>(null);

  useEffect(() => {
    setForm({
      name: savedProfile.name ?? authName,
      phone: savedProfile.phone ?? "",
      avatar: savedProfile.avatar ?? ""
    });
    setErrors({});
    setMessage(null);
  }, [authName, savedProfile]);

  function updateForm(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setMessage(null);
  }

  function chooseAvatar() {
    fileInputRef.current?.click();
  }

  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ tone: "error", text: text.validImage });
      return;
    }

    if (file.size > 1024 * 1024) {
      setMessage({ tone: "error", text: text.imageTooLarge });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateForm("avatar", typeof reader.result === "string" ? reader.result : "");
      setMessage({ tone: "info", text: text.imageReady });
    };
    reader.readAsDataURL(file);
  }

  function saveProfile(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = text.nameError;
    if (form.phone.trim() && !/^\+?[0-9 ()-]{8,20}$/.test(form.phone.trim())) {
      nextErrors.phone = text.phoneError;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage({ tone: "error", text: text.reviewError });
      return;
    }

    window.localStorage.setItem(profileStorageKey(email || "guest"), JSON.stringify({
      name: form.name.trim(),
      phone: form.phone.trim(),
      avatar: form.avatar
    }));
    setMessage({ tone: "success", text: text.saved });
  }

  return (
    <>
      <PageHeader eyebrow={text.account} title={text.settingsTitle} description={text.settingsDescription} />
      <div className="settings-grid">
        <Card className="settings-card">
          <div className="section-heading"><UserRound size={19} /><h2>{text.personalInfo}</h2></div>
          <form className="settings-profile-form" onSubmit={saveProfile}>
            <div className="settings-avatar-row">
              {form.avatar ? <img className="avatar large avatar-image" src={form.avatar} alt={text.avatarAlt} /> : <span className="avatar large">{getInitials(form.name || authName)}</span>}
              <input ref={fileInputRef} className="avatar-upload-input" type="file" accept="image/*" onChange={uploadAvatar} />
              <Button type="button" variant="ghost" icon={<Camera size={16} />} onClick={chooseAvatar}>{text.uploadAvatar}</Button>
            </div>
            <div className="meta-grid">
              <div className="form-field">
                <label htmlFor="profile-name">{text.displayName}</label>
                <Input id="profile-name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder={text.displayNamePlaceholder} />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div className="form-field">
                <label htmlFor="profile-email">{text.email}</label>
                <Input id="profile-email" type="email" value={email || text.signedOut} disabled readOnly />
              </div>
              <div className="form-field">
                <label htmlFor="profile-phone">{text.phone}</label>
                <Input id="profile-phone" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} inputMode="tel" placeholder="+84 ..." />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>
            </div>
            {message && <div className={`settings-message settings-message-${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</div>}
            <div className="settings-save-row">
              <Button type="submit" icon={<Save size={16} />}>{text.save}</Button>
            </div>
          </form>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><LockKeyhole size={19} /><h2>{text.security}</h2></div>
          <div className="settings-list"><div><strong>{text.changePassword}</strong><p>{text.changePasswordDescription}</p></div><Button variant="secondary" size="sm">{text.changePassword}</Button></div>
          <div className="settings-list"><div><strong>{text.twoFactor}</strong><p>{text.twoFactorDescription}</p></div><label className="toggle"><input type="checkbox" /> <span>{text.enable2fa}</span></label></div>
          <div className="settings-list"><div><strong>{text.recentDevice}</strong><p>{text.recentDeviceDescription}</p></div><Chip tone="success"><MonitorSmartphone size={14} /> {text.trusted}</Chip></div>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><Languages size={19} /><h2>{text.appearance}</h2></div>
          <div className="meta-grid">
            <div className="form-field"><label>{text.theme}</label><select className="input" defaultValue="light"><option value="light">{text.lightMode}</option><option value="dark">{text.darkMode}</option></select></div>
            <div className="form-field"><label>{text.language}</label><select className="input" defaultValue="vi"><option value="vi">{text.vietnamese}</option><option value="en">{text.english}</option></select></div>
          </div>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><Mail size={19} /><h2>{text.notifications}</h2></div>
          <div className="settings-list"><span>{text.emailNotifications}</span><label className="toggle"><input type="checkbox" defaultChecked /> <span>{text.email}</span></label></div>
          <div className="settings-list"><span>{text.appNotifications}</span><label className="toggle"><input type="checkbox" defaultChecked /> <span>{text.app}</span></label></div>
          <div className="page-actions"><Chip>{text.system}</Chip><Chip tone="primary">{text.learning}</Chip><Chip>{text.promotion}</Chip></div>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><CreditCard size={19} /><h2>{text.plan}</h2></div>
          <div className="settings-list"><div><strong>{text.currentPlan}</strong><p>{text.billingDescription}</p></div><Button>{text.upgrade}</Button></div>
          <Button variant="ghost">{text.cancelPlan}</Button>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><ShieldCheck size={19} /><h2>{text.securityNote}</h2></div>
          <p>{text.awsNote}</p>
        </Card>
      </div>
    </>
  );
}
