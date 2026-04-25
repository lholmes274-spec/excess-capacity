export default function BlogPage() {
  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "0 20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <h1 style={{ fontSize: "34px", marginBottom: "20px" }}>
          Make Money Locally: Services, Rentals, and Items You Can List Today
        </h1>

        <p style={{ marginBottom: "25px", color: "#555", lineHeight: "1.7" }}>
          Looking for ways to earn extra income locally? Prosperity Hub makes it easy to
          turn your skills, space, or unused items into real income by connecting you
          with people in your area.
        </p>

        <hr style={{ margin: "30px 0", borderColor: "#eee" }} />

        <h2>1. Offer Local Services</h2>
        <p style={{ marginBottom: "20px", lineHeight: "1.7" }}>
          You can create listings for services like notary work, cleaning, consulting,
          or other skills. Local services are one of the fastest ways to start earning.
        </p>

        <h2>2. Rent Out Items You Already Own</h2>
        <p style={{ marginBottom: "20px", lineHeight: "1.7" }}>
          Tools, vehicles, equipment, or storage space can all be rented out. If you
          already own it and don’t use it every day, it can generate income.
        </p>

        <h2>3. Sell Items You No Longer Need</h2>
        <p style={{ marginBottom: "25px", lineHeight: "1.7" }}>
          List items for sale and connect with local buyers. This is a simple way to
          declutter while making money.
        </p>

        <div
          style={{
            background: "#f8fafc",
            padding: "25px",
            borderRadius: "10px",
            marginTop: "30px",
          }}
        >
          <h2 style={{ marginBottom: "15px" }}>Why Use Prosperity Hub?</h2>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>All-in-one marketplace for services, rentals, and sales</li>
            <li>Connect with local users in your area</li>
            <li>Simple and fast listing process</li>
          </ul>
        </div>

        <div
          style={{
            marginTop: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: "15px" }}>
            Ready to get started?
          </p>

          <a
            href="/add-listing"
            style={{
              display: "inline-block",
              background: "#1d4ed8",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Create Your First Listing
          </a>
        </div>
      </div>
    </main>
  );
}