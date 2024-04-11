import Image from "next/image";

export function Navbar() {
  return (
    <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-co-connect">
      <div className="container-fluid">
        <a className="navbar-brand float-right" href="#">
          <Image
            width={36}
            height={36}
            src="/coconnect-logo.png"
            alt="coconnect-logo"
          />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarCollapse"
          aria-controls="navbarCollapse"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className=" navbar-collapse" id="navbarCollapse">
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            <li className="nav-item active">
              <a className="nav-link" aria-current="page" href="/">
                Home
              </a>
            </li>
            <li className="nav-item active">
              <a className="nav-link" aria-current="page" href="/datasets">
                Datasets
              </a>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                href="#"
              >
                Scan Reports
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                <li>
                  <a className="dropdown-item" href="/scanreports">
                    Scan Reports
                  </a>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a className="dropdown-item" href="/scanreports/create">
                    New Scan Report Upload
                  </a>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                href="https://hdruk.github.io/CaRROT-Docs/"
                target="_blank"
              >
                Documentation
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/accounts/password_change">
                Change Password
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/accounts/logout">
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
