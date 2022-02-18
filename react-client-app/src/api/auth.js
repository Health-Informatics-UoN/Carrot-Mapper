import Cookies from 'js-cookie'

const loginUrl = `${process.env.CCOM_APP_URL}api-token-auth/`

// function to log in and get the user's token
const useLogin =  async (username, password) => {
    const response = await fetch(loginUrl, {
        method: "POST",
        body: JSON.stringify(
            {
                username: username,
                password: password,
            }
        )
    });
    const token = await response.json()
    // Put the token into a cookie, which will expire after 1 day
    Cookies.set("CCOM_AUTH_TOKEN", token["token"], {expires: 1})
}

export default useLogin