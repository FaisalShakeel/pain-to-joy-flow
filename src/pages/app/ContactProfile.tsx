/**
 * /app/contact/:id  and  /v/:id  both render the same canonical
 * AVAILOCK profile. This page is a thin wrapper around the reusable
 * <CanonicalProfile /> component so every profile surface across the
 * web app stays visually and structurally identical — only responsive
 * scaling differs.
 */
import CanonicalProfile from "@/components/app/profile/CanonicalProfile";

interface Props {
  guestMode?: boolean;
}

const ContactProfile = ({ guestMode = false }: Props) => (
  <CanonicalProfile guestMode={guestMode} />
);

export default ContactProfile;