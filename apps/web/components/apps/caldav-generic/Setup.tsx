import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Toaster } from "sonner";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Alert } from "@calcom/ui/components/alert";
import { Button } from "@calcom/ui/components/button";
import { Form, TextField, SelectField } from "@calcom/ui/components/form";

const PROVIDERS = [
  { value: "proton", label: "Proton Calendar", needsUrl: true, hint: "Use Proton Bridge CalDAV URL. Read-only due to encryption." },
  { value: "fastmail", label: "Fastmail", needsUrl: false, hint: "Use your Fastmail email and app-specific password." },
  { value: "icloud", label: "Apple iCloud", needsUrl: false, hint: "Use Apple ID and app-specific password from appleid.apple.com" },
  { value: "nextcloud", label: "Nextcloud", needsUrl: true, hint: "URL: https://your-server/remote.php/dav/calendars/USERNAME/" },
  { value: "synology", label: "Synology Calendar", needsUrl: true, hint: "URL: https://your-nas:5001/caldav/USERNAME/" },
  { value: "zoho", label: "Zoho Calendar", needsUrl: false, hint: "Use your Zoho email and app-specific password." },
  { value: "custom", label: "Other CalDAV Server", needsUrl: true, hint: "Enter your CalDAV server URL." },
];

export default function CalDavGenericSetup() {
  const { t } = useLocale();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      providerSlug: "custom",
      url: "",
      username: "",
      password: "",
    },
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);

  const selectedProvider = form.watch("providerSlug");
  const providerConfig = PROVIDERS.find((p) => p.value === selectedProvider);
  const needsUrl = providerConfig?.needsUrl ?? true;
  const hint = providerConfig?.hint ?? "";

  return (
    <div className="bg-emphasis flex h-screen">
      <div className="bg-default m-auto rounded p-5 md:w-[560px] md:p-10">
        <div className="flex flex-col space-y-5 md:flex-row md:space-x-5 md:space-y-0">
          <div>
            <img
              src="/api/app-store/caldav-generic/icon.svg"
              alt="CalDAV Calendar"
              className="h-12 w-12 max-w-2xl"
            />
          </div>
          <div className="flex w-10/12 flex-col">
            <h1 className="text-default">Connect CalDAV Calendar</h1>
            <div className="mt-1 text-sm">{t("credentials_stored_encrypted")}</div>
            <div className="my-2 mt-3">
              <Form
                form={form}
                handleSubmit={async (values) => {
                  setErrorMessage("");
                  setSuccessMessage("");
                  setIsReadOnly(false);

                  const res = await fetch("/api/integrations/caldav-generic/add", {
                    method: "POST",
                    body: JSON.stringify(values),
                    headers: { "Content-Type": "application/json" },
                  });

                  const json = await res.json();

                  if (!res.ok) {
                    setErrorMessage(json?.message || t("something_went_wrong"));
                  } else {
                    if (json.capabilities && !json.capabilities.write) {
                      setIsReadOnly(true);
                      setSuccessMessage(json.message);
                      // Delay redirect to show message
                      setTimeout(() => router.push(json.url), 2000);
                    } else {
                      router.push(json.url);
                    }
                  }
                }}>
                <fieldset className="space-y-4" disabled={form.formState.isSubmitting}>
                  <SelectField
                    label="Provider"
                    options={PROVIDERS}
                    value={PROVIDERS.find((p) => p.value === selectedProvider)}
                    onChange={(option) => {
                      if (option) {
                        form.setValue("providerSlug", option.value);
                        form.setValue("url", "");
                      }
                    }}
                  />

                  {hint && <p className="text-subtle text-sm">{hint}</p>}

                  {needsUrl && (
                    <TextField
                      required
                      type="text"
                      {...form.register("url")}
                      label={t("calendar_url")}
                      placeholder="https://caldav.example.com/calendars/"
                    />
                  )}

                  <TextField
                    required
                    type="text"
                    {...form.register("username")}
                    label={t("username")}
                    placeholder="you@example.com"
                  />

                  <TextField
                    required
                    type="password"
                    {...form.register("password")}
                    label={t("password")}
                    placeholder="•••••••••••••"
                    autoComplete="password"
                  />
                </fieldset>

                {errorMessage && <Alert severity="error" title={errorMessage} className="my-4" />}

                {isReadOnly && successMessage && (
                  <Alert severity="warning" title="Read-Only Mode" className="my-4">
                    {successMessage}
                  </Alert>
                )}

                <div className="mt-5 justify-end space-x-2 rtl:space-x-reverse sm:mt-4 sm:flex">
                  <Button type="button" color="secondary" onClick={() => router.back()}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" loading={form.formState.isSubmitting}>
                    {t("save")}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
