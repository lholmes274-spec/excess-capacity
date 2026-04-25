export default function BlogPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
        lineHeight: "1.7",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        Make Money Locally: Services, Rentals, and Items You Can List Today
      </h1>

      <p style={{ marginBottom: "20px", color: "#555" }}>
        Looking for ways to earn extra income locally? Prosperity Hub makes it easy to
        turn your skills, space, or unused items into real income by connecting you
        with people in your area.
      </p>

      <h2 style={{ marginTop: "30px" }}>1. Offer Local Services</h2>
      <p style={{ marginBottom: "15px" }}>
        You can create listings for services like notary work, cleaning, consulting,
        or other skills. Local services are one of the fastest ways to start earning.
      </p>

      <h2 style={{ marginTop: "30px" }}>2. Rent Out Items You Already Own</h2>
      <p style={{ marginBottom: "15px" }}>
        Tools, vehicles, equipment, or storage space can all be rented out. If you
        already own it and don’t use it every day, it can generate income.
      </p>

      <h2 style={{ marginTop: "30px" }}>3. Sell Items You No Longer Need</h2>
      <p style={{ marginBottom: "20px" }}>
        List items for sale and connect with local buyers. This is a simple way to
        declutter while making money.
      </p>

      <div
        style={{
          background: "#f9fafb",
          padding: "20px",
          borderRadius: "10px",
          marginTop: "30px",
        }}
      >
        <h2>Why Use Prosperity Hub?</h2>
        <ul style={{ paddingLeft: "20px" }}>
          <li>All-in-one marketplace for services, rentals, and sales</li>
          <li>Connect with local users in your area</li>
          <li>Simple listing process</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
        }}
      >
        <p style={{ marginBottom: "15px", fontWeight: "bold" }}>
          Ready to get started?
        </p>

        <a
          href="/add-listing"
          style={{
            display: "inline-block",
            background: "#2563eb",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Create Your First Listing
        </a>
      </div>
    </main>
  );
}