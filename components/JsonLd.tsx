/**
 * Renders one or more JSON-LD structured-data blocks. Pass a single object or
 * an array of schema.org objects.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inject here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
